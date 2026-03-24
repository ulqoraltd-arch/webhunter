"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Activity, Globe, Mail, Clock, RefreshCw, Server, Terminal, Network, ShieldCheck, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { io, Socket } from "socket.io-client"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

function ProgressContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const campId = searchParams.get('camp')
  const runId = searchParams.get('run')
  const db = useFirestore()
  const { user } = useUser()

  const runRef = useMemoFirebase(() => {
    if (!db || !user || !campId || !runId) return null
    return doc(db, "admins", user.uid, "campaigns", campId, "runs", runId)
  }, [db, user, campId, runId])

  const { data: runData, isLoading: isRunLoading } = useDoc(runRef)

  const [activeLogs, setActiveLogs] = useState<{msg: string, type: 'info' | 'success' | 'warn'}[]>([])
  const [recentSuccesses, setRecentSuccesses] = useState<any[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isDone, setIsDone] = useState(false)
  
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!campId) return

    const newSocket = io()
    setSocket(newSocket)

    newSocket.on('connect', () => {
      console.log('[SOCKET] Feed Established')
      newSocket.emit('join-campaign', campId)
      setActiveLogs(prev => [{ msg: `[${new Date().toLocaleTimeString()}] Neural Link Established.`, type: 'success' }, ...prev])
    })

    newSocket.on('campaign:start', (data) => {
      setActiveLogs(p => [{ msg: `[${new Date().toLocaleTimeString()}] Cluster Activation: ${data.campaignId}`, type: 'info' }, ...p])
    })

    newSocket.on('campaign:progress', (data) => {
      setActiveLogs(p => [{ msg: `[${new Date().toLocaleTimeString()}] Extracted ${data.emailsFound} IDs from ${data.domain}`, type: 'info' }, ...p])
      if (data.emailsFound > 0) {
        setRecentSuccesses(prev => [{ 
          domain: data.domain, 
          emails: data.emailsFound, 
          node: data.node, 
          timestamp: new Date() 
        }, ...prev].slice(0, 10))
      }
    })

    newSocket.on('campaign:completed', () => {
      setIsDone(true)
      setActiveLogs(p => [{ msg: `[${new Date().toLocaleTimeString()}] QUOTA REACHED. System Standby.`, type: 'success' }, ...p])
    })

    newSocket.on('connect_error', () => {
      setActiveLogs(p => [{ msg: `[${new Date().toLocaleTimeString()}] Packet loss detected. Retrying...`, type: 'warn' }, ...p])
    })

    return () => {
      newSocket.close()
    }
  }, [campId])

  if (isRunLoading || !runData) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-primary">
      <Network className="h-12 w-12 animate-pulse mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-glow animate-pulse">Establishing Neural Link...</p>
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
                  {isDone ? <CheckCircle className="h-12 w-12 text-green-400" /> : <Activity className="h-12 w-12 text-accent animate-pulse" />}
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-headline font-black text-white mb-2 italic uppercase tracking-tighter">Cluster Live Feed</h1>
                <div className="flex items-center space-x-6">
                  <Badge className={cn("font-black px-5 py-1.5 tracking-[0.2em] text-[10px] shadow-glow", isDone ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-accent text-accent-foreground shadow-[0_0_15px_rgba(90,212,255,0.4)]")}>
                    {isDone ? 'COMPLETED' : runData.status.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] font-black text-muted-foreground flex items-center uppercase tracking-[0.2em]">
                    <Clock className="h-3.5 w-3.5 mr-2.5 text-primary" /> WORKER HEARTBEAT ACTIVE
                  </span>
                </div>
              </div>
            </div>
            {isDone && (
              <Button onClick={() => router.push('/results')} className="bg-primary hover:bg-primary/90 h-14 px-8 font-black uppercase tracking-widest">
                Access Repository
              </Button>
            )}
          </div>

          <Card className="bg-card border-white/5 overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.6)] relative group">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
               <div 
                 className={cn("absolute inset-y-0 left-0 transition-all duration-1000 shadow-[0_0_30px_currentcolor]", isDone ? "bg-green-400 text-green-400" : "bg-gradient-to-r from-primary via-accent to-green-400 text-accent")} 
                 style={{ width: `${isDone ? 100 : progressPercent}%` }}
               />
            </div>
            <CardContent className="p-12 grid grid-cols-1 md:grid-cols-4 gap-16">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Efficiency</p>
                <h2 className="text-7xl font-headline font-black text-white tabular-nums tracking-tighter text-glow">{isDone ? '100' : progressPercent}%</h2>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Nodes Dispatched</p>
                <h2 className="text-6xl font-headline font-black text-white tabular-nums tracking-tighter italic">{(runData.progressUrlsProcessed || 0).toLocaleString()}</h2>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Yielded Domains</p>
                <h2 className="text-6xl font-headline font-black text-accent tabular-nums tracking-tighter accent-glow italic">{(runData.progressDomainsWithEmails || 0).toLocaleString()}</h2>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Total Identities</p>
                <h2 className="text-6xl font-headline font-black text-primary tabular-nums tracking-tighter text-glow italic">{(runData.totalEmailsExtracted || 0).toLocaleString()}</h2>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Card className="bg-black/40 border-white/5 h-[500px] flex flex-col relative overflow-hidden group border-t-2 border-t-primary/40">
              <CardHeader className="p-8 border-b border-white/5 flex flex-row items-center justify-between">
                <CardTitle className="text-2xl font-headline font-black italic flex items-center uppercase tracking-tight">
                  <Terminal className="h-6 w-6 mr-4 text-primary" />
                  Neural Signal Buffer
                </CardTitle>
                {!isDone && <RefreshCw className="h-5 w-5 text-primary/40 animate-spin" />}
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden font-code">
                <ScrollArea className="h-full w-full">
                  <div className="p-8 space-y-2">
                    {activeLogs.map((log, i) => (
                      <div key={i} className={cn(
                        "text-[12px] leading-relaxed transition-opacity duration-500",
                        log.type === 'success' ? 'text-green-400 font-bold' : 
                        log.type === 'warn' ? 'text-yellow-400' : 'text-muted-foreground'
                      )}>
                        {log.msg}
                      </div>
                    ))}
                    {activeLogs.length === 0 && (
                      <div className="h-64 flex flex-col items-center justify-center opacity-20">
                        <Loader2 className="h-12 w-12 animate-spin mb-4" />
                        <p className="text-xs uppercase font-black tracking-widest">Awaiting Neural Handshake...</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 border-t-2 border-t-accent/40 relative overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5 relative z-10">
                <CardTitle className="text-2xl font-headline font-black italic flex items-center uppercase tracking-tight">
                  <Server className="h-6 w-6 mr-4 text-accent" />
                  Extraction Stream
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-5 relative z-10 h-[400px] overflow-hidden">
                <ScrollArea className="h-full pr-4">
                  <div className="space-y-4">
                    {recentSuccesses.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-accent/10 group hover:border-accent/40 transition-all duration-500">
                        <div className="flex items-center space-x-5">
                          <div className="p-3 bg-accent/5 rounded-xl border border-accent/10">
                            <Globe className="h-6 w-6 text-accent/80" />
                          </div>
                          <div>
                            <p className="text-md font-black text-white tracking-tight">{item.domain}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.2em] mt-1 opacity-60">{item.node}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-accent/10 text-accent font-black text-sm px-4 py-1.5 rounded-xl">+{item.emails} IDS</Badge>
                      </div>
                    ))}
                    {recentSuccesses.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-16 opacity-40 uppercase font-black tracking-[0.3em]">Awaiting Cluster Data...</p>}
                  </div>
                </ScrollArea>
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
