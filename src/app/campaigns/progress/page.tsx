
"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Activity, Globe, Mail, Clock, RefreshCw, Server, ShieldCheck, Terminal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, collection, addDoc, serverTimestamp, increment } from "firebase/firestore"
import { processDomainExtraction, ScrapingJob } from "@/app/lib/scraper-engine"

function ProgressContent() {
  const searchParams = useSearchParams()
  const campId = searchParams.get('camp')
  const runId = searchParams.get('run')
  const db = useFirestore()
  const { user } = useUser()

  const runRef = useMemoFirebase(() => {
    if (!db || !user || !campId || !runId) return null
    return doc(db, "admins", user.uid, "campaigns", campId, "runs", runId)
  }, [db, user, campId, runId])

  const campaignRef = useMemoFirebase(() => {
    if (!db || !user || !campId) return null
    return doc(db, "admins", user.uid, "campaigns", campId)
  }, [db, user, campId])

  const { data: runData, isLoading: isRunLoading } = useDoc(runRef)

  const [activeScans, setActiveScans] = useState<string[]>([])
  const [recentSuccesses, setRecentSuccesses] = useState<any[]>([])

  useEffect(() => {
    if (!runData || runData.status !== "Running" || !user || !campId || !runId || !runRef || !campaignRef) return

    const interval = setInterval(async () => {
      const domain = `node-${Math.floor(Math.random() * 10000)}.ai`
      setActiveScans(prev => [domain, ...prev].slice(0, 5))

      const job: ScrapingJob = { domain, campaignId: campId, adminId: user.uid, runId, retryCount: 0 }
      const result = await processDomainExtraction(job, Math.floor(Math.random() * 100))

      if (result.status === 'success') {
        const validCount = result.emails.filter(e => e.isValid).length
        const flaggedCount = result.emails.length - validCount

        // 1. Update Aggregate Stats in Run Doc
        updateDoc(runRef, {
          progressUrlsProcessed: increment(1),
          progressDomainsWithEmails: increment(1),
          totalEmailsExtracted: increment(result.emails.length),
          validEmailsExtracted: increment(validCount),
          flaggedEmailsExtracted: increment(flaggedCount),
          updatedAt: serverTimestamp()
        })

        // 2. Update Global Campaign Stats
        updateDoc(campaignRef, {
          totalDomainsFetched: increment(1),
          totalEmailsExtracted: increment(result.emails.length),
          validEmailsCount: increment(validCount),
          flaggedEmailsCount: increment(flaggedCount),
          updatedAt: serverTimestamp()
        })

        // 3. Log Scraped Domain
        const domainCol = collection(db, "admins", user.uid, "campaigns", campId, "runs", runId, "domains")
        const domainDocRef = await addDoc(domainCol, {
          domainName: domain,
          adminUserId: user.uid,
          campaignId: campId,
          campaignRunId: runId,
          emailCount: result.emails.length,
          status: result.status,
          pageUrls: result.pagesScanned,
          metadata: JSON.stringify(result.metadata),
          lastScrapedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        })

        // 4. Log Individual Emails
        const emailCol = collection(db, "admins", user.uid, "campaigns", campId, "runs", runId, "domains", domainDocRef.id, "emails")
        for (const email of result.emails) {
          await addDoc(emailCol, {
            emailAddress: email.address,
            adminUserId: user.uid,
            campaignId: campId,
            campaignRunId: runId,
            scrapedDomainId: domainDocRef.id,
            isValid: email.isValid,
            validationStatus: email.validationStatus,
            urlFoundOn: result.pagesScanned[0],
            createdAt: serverTimestamp()
          })
        }

        // 5. Log Telemetry Event for Dashboard
        if (Math.random() > 0.8) {
          await addDoc(collection(db, "admins", user.uid, "notifications"), {
            adminUserId: user.uid,
            title: "Identity Verified",
            description: `Node ${domain} synchronized. ${result.emails.length} identities added to repository.`,
            timestamp: serverTimestamp(),
            isRead: false,
            eventType: "campaignCompleted",
            createdAt: serverTimestamp()
          })
        }

        setRecentSuccesses(prev => [{ domain, emails: result.emails.length, node: result.metadata.apiNode }, ...prev].slice(0, 4))
      }
    }, 4500)

    return () => clearInterval(interval)
  }, [runData, user, campId, runId, db, runRef, campaignRef])

  if (isRunLoading || !runData) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-primary">
      <Activity className="h-12 w-12 animate-pulse mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em]">Establishing Neural Link...</p>
    </div>
  )

  const progressPercent = Math.min(100, Math.floor((runData.progressUrlsProcessed / (runData.progressTotalUrlsToProcess || 1)) * 100)) || 0

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-accent/10 rounded-2xl border border-accent/20">
                <Activity className="h-10 w-10 text-accent animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-headline font-black text-white mb-2 italic uppercase tracking-tighter">Infrastructure Live Feed</h1>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-accent text-accent-foreground font-black px-4 py-1 tracking-widest text-[10px]">{runData.status.toUpperCase()}</Badge>
                  <span className="text-[10px] font-black text-muted-foreground flex items-center uppercase tracking-widest">
                    <Clock className="h-3 w-3 mr-2" /> Session active: {format(runData.startTime?.toDate() || new Date(), 'HH:mm:ss')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" className="border-white/10 hover:bg-white/5 font-black text-[10px] tracking-widest px-6 h-12">PAUSE CLUSTER</Button>
              <Button variant="destructive" className="font-black text-[10px] tracking-widest px-6 h-12">TERMINATE ENGINE</Button>
            </div>
          </div>

          <Card className="bg-card border-white/5 overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
               <div 
                 className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-green-400 transition-all duration-1000 shadow-[0_0_15px_rgba(90,212,255,0.5)]" 
                 style={{ width: `${progressPercent}%` }}
               />
            </div>
            <CardContent className="p-10 grid grid-cols-1 md:grid-cols-4 gap-12">
              <div className="space-y-3">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Job Completion</p>
                <h2 className="text-6xl font-headline font-black text-white tabular-nums tracking-tighter">{progressPercent}%</h2>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Requests Dispatched</p>
                <h2 className="text-5xl font-headline font-black text-white tabular-nums tracking-tighter">{(runData.progressUrlsProcessed || 0).toLocaleString()}</h2>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Domains Yielded</p>
                <h2 className="text-5xl font-headline font-black text-accent tabular-nums tracking-tighter">{(runData.progressDomainsWithEmails || 0).toLocaleString()}</h2>
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">Identities Verified</p>
                <h2 className="text-5xl font-headline font-black text-primary tabular-nums tracking-tighter">{(runData.totalEmailsExtracted || 0).toLocaleString()}</h2>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-card border-white/5 border-t-2 border-t-primary/20">
              <CardHeader className="p-6 border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-headline font-black italic flex items-center uppercase tracking-tight">
                  <Terminal className="h-5 w-5 mr-3 text-primary" />
                  Cluster Telemetry
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-primary/40 animate-spin" />
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {activeScans.map((domain, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-white/5 text-[11px] font-code group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center space-x-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                       <span className="text-muted-foreground truncate max-w-[200px]">{domain}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-black tracking-widest border-primary/20 text-primary bg-primary/5 uppercase">Scanning Layer 3</Badge>
                  </div>
                ))}
                {activeScans.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-10 opacity-40 uppercase tracking-widest">Handshaking with API nodes...</p>}
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 border-t-2 border-t-accent/20">
              <CardHeader className="p-6 border-b border-white/5">
                <CardTitle className="text-xl font-headline font-black italic flex items-center uppercase tracking-tight">
                  <Server className="h-5 w-5 mr-3 text-accent" />
                  Validated Node Output
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                 {recentSuccesses.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-xl border border-accent/10 group hover:border-accent/30 transition-all">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-accent/5 rounded-lg">
                        <Globe className="h-5 w-5 text-accent/60" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white tracking-tight">{item.domain}</p>
                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest">Auth: {item.node}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent font-black tracking-tighter text-xs px-3">+{item.emails} IDS</Badge>
                  </div>
                ))}
                {recentSuccesses.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-10 opacity-40 uppercase tracking-widest">Awaiting extraction sync...</p>}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function CampaignProgressPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-primary">
        <Activity className="h-12 w-12 animate-pulse mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Initializing Clusters...</p>
      </div>
    }>
      <ProgressContent />
    </Suspense>
  )
}
