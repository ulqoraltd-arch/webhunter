
"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Activity, Globe, Mail, Clock, RefreshCw, Server, Terminal, Network } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { format } from "date-fns"
import { io, Socket } from "socket.io-client"

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

  const { data: runData, isLoading: isRunLoading } = useDoc(runRef)

  const [activeScans, setActiveScans] = useState<string[]>([])
  const [recentSuccesses, setRecentSuccesses] = useState<any[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    if (!campId) return

    // Initialize Socket.IO connection to the custom server
    const newSocket = io()
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('[SOCKET] Connected to production telemetry server')
      newSocket.emit('join-campaign', campId)
    })

    newSocket.on('progress-update', (data) => {
      setActiveScans(prev => [data.domain, ...prev].slice(0, 6))
      if (data.emailsFound > 0) {
        setRecentSuccesses(prev => [{ 
          domain: data.domain, 
          emails: data.emailsFound, 
          node: data.node, 
          timestamp: new Date() 
        }, ...prev].slice(0, 5))
      }
    })

    return () => {
      newSocket.close()
    }
  }, [campId])

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
                <h1 className="text-5xl font-headline font-black text-white mb-2 italic uppercase tracking-tighter">Infrastructure Live Feed</h1>
                <div className="flex items-center space-x-6">
                  <Badge className="bg-accent text-accent-foreground font-black px-5 py-1.5 tracking-[0.2em] text-[10px] shadow-[0_0_15px_rgba(90,212,255,0.4)]">{runData.status.toUpperCase()}</Badge>
                  <span className="text-[10px] font-black text-muted-foreground flex items-center uppercase tracking-[0.2em]">
                    <Clock className="h-3.5 w-3.5 mr-2.5 text-primary" /> BULLMQ CLUSTER ACTIVE
                  </span>
                </div>
              </div>
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
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Queue Progress</p>
                <h2 className="text-7xl font-headline font-black text-white tabular-nums tracking-tighter text-glow">{progressPercent}%</h2>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Dispatched</p>
                <h2 className="text-6xl font-headline font-black text-white tabular-nums tracking-tighter italic">{(runData.progressUrlsProcessed || 0).toLocaleString()}</h2>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Domains Yielded</p>
                <h2 className="text-6xl font-headline font-black text-accent tabular-nums tracking-tighter accent-glow italic">{(runData.progressDomainsWithEmails || 0).toLocaleString()}</h2>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Identities</p>
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
                  BullMQ Worker Feed
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <span className="text-[10px] font-black text-primary uppercase animate-pulse">Socket Live</span>
                  <RefreshCw className="h-5 w-5 text-primary/40 animate-spin" />
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-5 relative z-10">
                {activeScans.map((domain, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-white/5 text-[12px] font-code group hover:bg-white/[0.06] transition-all duration-500">
                    <div className="flex items-center space-x-4">
                       <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                       <span className="text-white/80 truncate max-w-[250px] font-medium tracking-tight">{domain}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] font-black tracking-[0.2em] border-primary/30 text-primary bg-primary/5 uppercase px-3 py-1">Worker Task</Badge>
                  </div>
                ))}
                {activeScans.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-16 opacity-40 uppercase font-black tracking-[0.3em]">Waiting for queue heartbeat...</p>}
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 border-t-2 border-t-accent/40 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent opacity-50" />
              <CardHeader className="p-8 border-b border-white/5 relative z-10">
                <CardTitle className="text-2xl font-headline font-black italic flex items-center uppercase tracking-tight">
                  <Server className="h-6 w-6 mr-4 text-accent" />
                  Validated Extraction Sync
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-5 relative z-10">
                 {recentSuccesses.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-accent/10 group hover:border-accent/40 transition-all duration-500">
                    <div className="flex items-center space-x-5">
                      <div className="p-3 bg-accent/5 rounded-xl border border-accent/10">
                        <Globe className="h-6 w-6 text-accent/80" />
                      </div>
                      <div>
                        <p className="text-md font-black text-white tracking-tight">{item.domain}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1 opacity-60">NODE: {item.node}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent font-black text-sm px-4 py-1.5 rounded-xl">+{item.emails} IDS</Badge>
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
    <Suspense fallback={null}>
      <ProgressContent />
    </Suspense>
  )
}
