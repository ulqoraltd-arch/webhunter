"use client"

import { useState, useEffect, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Activity, Globe, Clock, Server, Terminal, Network, CheckCircle, Loader2 } from "lucide-react"
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

  const campaignRef = useMemoFirebase(() => {
    if (!db || !user || !campId) return null
    return doc(db, "admins", user.uid, "campaigns", campId)
  }, [db, user, campId])

  const runRef = useMemoFirebase(() => {
    if (!db || !user || !campId || !runId) return null
    return doc(db, "admins", user.uid, "campaigns", campId, "runs", runId)
  }, [db, user, campId, runId])

  const { data: campData } = useDoc(campaignRef)
  const { data: runData } = useDoc(runRef)

  const [activeLogs, setActiveLogs] = useState<{msg: string, type: 'info' | 'success'}[]>([])
  const [recentSuccesses, setRecentSuccesses] = useState<any[]>([])
  const [isDone, setIsDone] = useState(false)

  useEffect(() => {
    if (!campId) return

    const socket = io()
    socket.emit('join-campaign', campId)

    socket.on('campaign:progress', (data) => {
      setActiveLogs(p => [{ msg: `[${new Date().toLocaleTimeString()}] ${data.node}: Found ${data.domain}`, type: 'info' }, ...p].slice(0, 50))
      if (data.emailsFound > 0) {
        setRecentSuccesses(prev => [{ domain: data.domain, emails: data.emailsFound, timestamp: new Date() }, ...prev].slice(0, 10))
      }
    })

    socket.on('campaign:completed', () => {
      setIsDone(true)
      setActiveLogs(p => [{ msg: `[SYSTEM] QUOTA REACHED. TASK COMPLETE.`, type: 'success' }, ...p])
    })

    return () => { socket.close() }
  }, [campId])

  if (!campData || !runData) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <p className="text-xs uppercase font-black tracking-widest text-primary/60">Initializing Engine...</p>
    </div>
  )

  const progressPercent = Math.min(100, Math.floor(((campData.validEmailsCount || 0) / (campData.targetEmailCount || 1)) * 100))

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-10 space-y-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="p-5 bg-accent/10 rounded-3xl border border-accent/20 backdrop-blur-xl">
                {isDone ? <CheckCircle className="h-12 w-12 text-green-400" /> : <Activity className="h-12 w-12 text-accent animate-pulse" />}
              </div>
              <div>
                <h1 className="text-5xl font-headline font-black text-white mb-2 italic uppercase tracking-tighter">{campData.name}</h1>
                <div className="flex items-center space-x-6">
                  <Badge className={cn("font-black px-5 py-1.5 tracking-[0.2em] text-[10px]", isDone ? "bg-green-500/20 text-green-400" : "bg-accent text-accent-foreground")}>
                    {isDone ? 'COMPLETED' : 'EXTRACTION ACTIVE'}
                  </Badge>
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                    Target: {campData.targetEmailCount} Domains with Emails
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

          <Card className="bg-card border-white/5 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5">
               <div className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
            </div>
            <CardContent className="p-12 grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Yield Progress</p>
                <h2 className="text-7xl font-headline font-black text-white tabular-nums tracking-tighter">{progressPercent}%</h2>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Nodes Processed</p>
                <h2 className="text-6xl font-headline font-black text-white tabular-nums tracking-tighter italic">{(runData.progressUrlsProcessed || 0).toLocaleString()}</h2>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.4em]">Unique Yields</p>
                <h2 className="text-6xl font-headline font-black text-accent tabular-nums tracking-tighter italic">{(campData.validEmailsCount || 0).toLocaleString()}</h2>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <Card className="bg-black/40 border-white/5 h-[500px] flex flex-col overflow-hidden">
              <CardHeader className="p-8 border-b border-white/5">
                <CardTitle className="text-2xl font-headline font-black italic flex items-center uppercase tracking-tight">
                  <Terminal className="h-6 w-6 mr-4 text-primary" />
                  Live Extraction Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0 font-code">
                <ScrollArea className="h-full w-full">
                  <div className="p-8 space-y-2">
                    {activeLogs.map((log, i) => (
                      <div key={i} className={cn("text-[12px] leading-relaxed", log.type === 'success' ? 'text-green-400 font-bold' : 'text-muted-foreground')}>
                        {log.msg}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 h-[500px] flex flex-col">
              <CardHeader className="p-8 border-b border-white/5">
                <CardTitle className="text-2xl font-headline font-black italic flex items-center uppercase tracking-tight">
                  <Server className="h-6 w-6 mr-4 text-accent" />
                  Yield Repository
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                <ScrollArea className="h-full">
                  <div className="p-8 space-y-4">
                    {recentSuccesses.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-white/[0.03] rounded-2xl border border-accent/10">
                        <div className="flex items-center space-x-5">
                          <Globe className="h-6 w-6 text-accent/80" />
                          <p className="text-md font-black text-white tracking-tight">{item.domain}</p>
                        </div>
                        <Badge variant="secondary" className="bg-accent/10 text-accent font-black">+{item.emails} IDs</Badge>
                      </div>
                    ))}
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
  return <Suspense fallback={null}><ProgressContent /></Suspense>
}
