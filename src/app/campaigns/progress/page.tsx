
"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Activity, Globe, Mail, Clock, RefreshCw, StopCircle, CheckCircle2, Server } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc, updateDoc, collection, addDoc, serverTimestamp } from "firebase/firestore"
import { processDomainExtraction, ScrapingJob } from "@/app/lib/scraper-engine"

function ProgressContent() {
  const searchParams = useSearchParams()
  const campId = searchParams.get('camp')
  const runId = searchParams.get('run')
  const db = useFirestore()
  const { user } = useUser()

  // Real-time Firestore document sync
  const runRef = useMemoFirebase(() => {
    if (!db || !user || !campId || !runId) return null
    return doc(db, "admins", user.uid, "campaigns", campId, "runs", runId)
  }, [db, user, campId, runId])

  const { data: runData, isLoading: isRunLoading } = useDoc(runRef)

  const [activeScans, setActiveScans] = useState<string[]>([])
  const [recentSuccesses, setRecentSuccesses] = useState<any[]>([])

  // Engine Simulation (Simulating the backend workers)
  useEffect(() => {
    if (!runData || runData.status !== "Running" || !user || !campId || !runId) return

    const interval = setInterval(async () => {
      const domain = `domain-${Math.floor(Math.random() * 10000)}.com`
      setActiveScans(prev => [domain, ...prev].slice(0, 5))

      const job: ScrapingJob = { domain, campaignId: campId, adminId: user.uid, runId, retryCount: 0 }
      const result = await processDomainExtraction(job, Math.floor(Math.random() * 100))

      if (result.status === 'success') {
        // 1. Update Aggregate Stats in Run Doc
        updateDoc(runRef!, {
          progressUrlsProcessed: (runData.progressUrlsProcessed || 0) + 1,
          progressDomainsWithEmails: (runData.progressDomainsWithEmails || 0) + 1,
          totalEmailsExtracted: (runData.totalEmailsExtracted || 0) + result.emails.length,
          updatedAt: serverTimestamp()
        })

        // 2. Log Scraped Domain
        const domainCol = collection(db, "admins", user.uid, "campaigns", campId, "runs", runId, "domains")
        await addDoc(domainCol, {
          domainName: domain,
          emailCount: result.emails.length,
          status: result.status,
          pageUrls: result.pagesScanned,
          metadata: JSON.stringify(result.metadata),
          lastScrapedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        })

        setRecentSuccesses(prev => [{ domain, emails: result.emails.length, node: result.metadata.apiNode }, ...prev].slice(0, 4))
      }
    }, 4000)

    return () => clearInterval(interval)
  }, [runData, user, campId, runId, db, runRef])

  if (isRunLoading || !runData) return <div className="p-8 text-white">Connecting to cluster...</div>

  const progressPercent = Math.floor((runData.progressUrlsProcessed / runData.progressTotalUrlsToProcess) * 100) || 0

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-accent/20 rounded-2xl">
                <Activity className="h-8 w-8 text-accent animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-headline font-bold text-white mb-1">Infrastructure Live Feed</h1>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-accent text-accent-foreground font-bold px-3">{runData.status.toUpperCase()}</Badge>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" /> Active extraction session
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="border-white/10 hover:bg-white/5">Pause Node</Button>
              <Button variant="destructive">Kill Engine</Button>
            </div>
          </div>

          <Card className="bg-card border-white/5 overflow-hidden shadow-2xl">
            <div className="h-2 w-full bg-white/5 relative overflow-hidden">
               <div 
                 className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent transition-all duration-1000" 
                 style={{ width: `${progressPercent}%` }}
               />
            </div>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Job Completion</p>
                <h2 className="text-4xl font-headline font-bold text-white">{progressPercent}%</h2>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Requests Dispatched</p>
                <h2 className="text-3xl font-headline font-bold text-white">{runData.progressUrlsProcessed.toLocaleString()}</h2>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Domains Yielded</p>
                <h2 className="text-3xl font-headline font-bold text-accent">{runData.progressDomainsWithEmails.toLocaleString()}</h2>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Identities Extracted</p>
                <h2 className="text-3xl font-headline font-bold text-primary">{runData.totalEmailsExtracted.toLocaleString()}</h2>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2 text-primary animate-spin" />
                  Cluster Telemetry
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeScans.map((domain, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 text-[10px] font-code">
                    <span className="text-muted-foreground truncate">{domain}</span>
                    <Badge variant="outline" className="text-[8px] border-primary/20 text-primary">SCANNING</Badge>
                  </div>
                ))}
                {activeScans.length === 0 && <p className="text-xs text-muted-foreground italic">Connecting to API nodes...</p>}
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center">
                  <Server className="h-4 w-4 mr-2 text-accent" />
                  Node Output
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 {recentSuccesses.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-accent/10">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-bold text-white">{item.domain}</p>
                        <p className="text-[9px] text-muted-foreground uppercase">Via {item.node}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent font-bold">+{item.emails} Emails</Badge>
                  </div>
                ))}
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
    <Suspense fallback={<div className="p-8 text-white">Initializing clusters...</div>}>
      <ProgressContent />
    </Suspense>
  )
}
