"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Activity, Globe, Mail, Clock, RefreshCw, Server, ShieldCheck, Terminal, Network, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, collection, addDoc, serverTimestamp, increment } from "firebase/firestore"
import { processDomainExtraction, ScrapingJob } from "@/app/lib/scraper-engine"
import { format } from "date-fns"

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
      setActiveScans(prev => [domain, ...prev].slice(0, 6))

      const job: ScrapingJob = { domain, campaignId: campId, adminId: user.uid, runId, retryCount: 0 }
      const result = await processDomainExtraction(job, Math.floor(Math.random() * 100))

      if (result.status === 'success') {
        const validCount = result.emails.filter(e => e.isValid).length
        const flaggedCount = result.emails.length - validCount

        updateDoc(runRef, {
          progressUrlsProcessed: increment(1),
          progressDomainsWithEmails: increment(1),
          totalEmailsExtracted: increment(result.emails.length),
          validEmailsExtracted: increment(validCount),
          flaggedEmailsExtracted: increment(flaggedCount),
          updatedAt: serverTimestamp()
        })

        updateDoc(campaignRef, {
          totalDomainsFetched: increment(1),
          totalEmailsExtracted: increment(result.emails.length),
          validEmailsCount: increment(validCount),
          flaggedEmailsCount: increment(flaggedCount),
          updatedAt: serverTimestamp()
        })

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

        if (Math.random() > 0.85) {
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

        setRecentSuccesses(prev => [{ domain, emails: result.emails.length, node: result.metadata.apiNode, timestamp: new Date() }, ...prev].slice(0, 5))
      }
    }, 3500)

    return () => clearInterval(interval)
  }, [runData, user, campId, runId, db, runRef, campaignRef])

  if (isRunLoading || !runData) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-primary">
      <Network className="h-12 w-12 animate-pulse mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-glow">Establishing Neural Link...</p>
    </div>
  )

  const progressPercent = Math.min(100, Math.floor((runData.progressUrlsProcessed / (runData.progressTotalUrlsToProcess || 1)) * 100)) || 0

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-10 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="relative">
                <div className="absolute inset-0 bg-accent/20 blur-xl animate-pulse rounded-full" />
                <div className="relative p-5 bg-accent/10 rounded-3xl border border-accent/20 backdrop-blur-xl">
                  <Activity className="h-12 w-12 text-accent animate-pulse" />
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-headline font-black text-white mb-2 italic uppercase tracking-tighter italic">Infrastructure Live Feed</h1>
                <div className="flex items-center space-x-6">
                  <Badge className="bg-accent text-accent-foreground font-black px-5 py-1.5 tracking-[0.2em] text-[10px] shadow-[0_0_15px_rgba(90,212,255,0.4)]">{runData.status.toUpperCase()}</Badge>
                  <span className="text-[10px] font-black text-muted-foreground flex items-center uppercase tracking-[0.2em]">
                    <Clock className="h-3.5 w-3.5 mr-2.5 text-primary" /> SESSION ACTIVE: {format(runData.startTime?.toDate() || new Date(), 'HH:mm:ss')}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" className="border-white/10 hover:bg-white/5 font-black text-[10px] tracking-[0.2em] px-8 h-14 rounded-2xl uppercase">Pause Cluster</Button>
              <Button variant="destructive" className="font-black text-[10px] tracking-[0.2em] px-8 h-14 rounded-2xl uppercase shadow-[0_0_20px_rgba(239,68,68,0.3)]">Terminate Engine</Button>
            </div>
          </div>

          <Card className="bg-card border-white/5 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
               <div 
                 className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-green-400 transition-all duration-1000 shadow-[0_0_30px_rgba(90,212,255,0.8)]" 
                 style={{ width: `${progressPercent}%` }}
               />
            </div>
            <CardContent className="p-12 grid grid-cols-1 md:grid-cols-4 gap-16">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Job Completion</p>
                <h2 className="text-7xl font-headline font-black text-white tabular-nums tracking-tighter text-glow">{progressPercent}%</h2>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Requests Dispatched</p>
                <h2 className="text-6xl font-headline font-black text-white tabular-nums tracking-tighter italic">{(runData.progressUrlsProcessed || 0).toLocaleString()}</h2>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Domains Yielded</p>
                <h2 className="text-6xl font-headline font-black text-accent tabular-nums tracking-tighter accent-glow italic">{(runData.progressDomainsWithEmails || 0).toLocaleString()}</h2>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Identities Verified</p>
                <h2 className="text-6xl font-headline font-black text-primary tabular-nums tracking-tighter text-glow italic">{(runData.totalEmailsExtracted || 0).toLocaleString()}</h2>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Card className="bg-card border-white/5 border-t-2 border-t-primary/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent opacity-50" />
              <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between relative z-10">
                <CardTitle className="text-2xl font-headline font-black italic flex items-center uppercase tracking-tight">
                  <Terminal className="h-6 w-6 mr-4 text-primary" />
                  Cluster Telemetry
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-black text-primary uppercase animate-pulse">Live</span>
                  <RefreshCw className="h-5 w-5 text-primary/40 animate-spin" />
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-5 relative z-10">
                {activeScans.map((domain, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-white/5 text-[12px] font-code group hover:bg-white/[0.06] transition-all duration-500">
                    <div className="flex items-center space-x-4">
                       <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_#6366f1]" />
                       <span className="text-white/80 truncate max-w-[250px] font-medium tracking-tight">{domain}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black tracking-[0.2em] border-primary/30 text-primary bg-primary/5 uppercase px-3 py-1">Layer 3 Scan</Badge>
                  </div>
                ))}
                {activeScans.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-16 opacity-40 uppercase font-black tracking-[0.3em]">Handshaking with API nodes...</p>}
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 border-t-2 border-t-accent/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent opacity-50" />
              <CardHeader className="p-8 border-b border-white/5 relative z-10">
                <CardTitle className="text-2xl font-headline font-black italic flex items-center uppercase tracking-tight">
                  <Server className="h-6 w-6 mr-4 text-accent" />
                  Validated Node Output
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-5 relative z-10">
                 {recentSuccesses.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-accent/10 group hover:border-accent/40 transition-all duration-500 hover:scale-[1.02]">
                    <div className="flex items-center space-x-5">
                      <div className="p-3 bg-accent/5 rounded-xl border border-accent/10">
                        <Globe className="h-6 w-6 text-accent/80" />
                      </div>
                      <div>
                        <p className="text-md font-black text-white tracking-tight">{item.domain}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1 opacity-60">AUTH: {item.node} • {format(item.timestamp, 'HH:mm:ss')}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent font-black tracking-tighter text-sm px-4 py-1.5 rounded-xl border border-accent/20">+{item.emails} IDS</Badge>
                  </div>
                ))}
                {recentSuccesses.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-16 opacity-40 uppercase font-black tracking-[0.3em]">Awaiting extraction sync...</p>}
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
        <Network className="h-12 w-12 animate-pulse mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-glow">Initializing Clusters...</p>
      </div>
    }>
      <ProgressContent />
    </Suspense>
  )
}