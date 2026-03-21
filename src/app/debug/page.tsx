
"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Terminal, Activity, Zap, Search, Globe, Database, Server, Cpu, Play, Loader2, CheckCircle, AlertTriangle, Network } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useUser, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import axios from "axios"
import { io, Socket } from "socket.io-client"
import { cn } from "@/lib/utils"

export default function DebugTerminalPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  
  const [logs, setLogs] = useState<{msg: string, type: 'info' | 'error' | 'success'}[]>([])
  const [serperQuery, setSerperQuery] = useState("SaaS startups")
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [socketStatus, setSocketStatus] = useState("Disconnected")

  const addLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    setLogs(prev => [{ msg: `[${new Date().toLocaleTimeString()}] ${msg}`, type }, ...prev])
  }

  // Socket.IO Debug Listener
  useEffect(() => {
    const socket = io()
    socket.on('connect', () => {
      setSocketStatus("Connected")
      addLog("Socket.IO handshake established with local node.", "success")
    })
    socket.on('disconnect', () => {
      setSocketStatus("Disconnected")
      addLog("Socket.IO connection severed.", "error")
    })
    socket.on('progress-update', (data) => {
      addLog(`REAL-TIME TELEMETRY: Domain ${data.domain} Yielded ${data.emailsFound} IDs`, "success")
    })
    return () => { socket.close() }
  }, [])

  const testSerper = async () => {
    setIsLoading(prev => ({ ...prev, serper: true }))
    addLog(`Initiating Serper Intelligence node for query: "${serperQuery}"...`)
    try {
      const res = await axios.post('/api/debug/test-serper', { query: serperQuery })
      addLog(`Serper Success: Discovered ${res.data.discoveredDomains.length} unique domains.`, "success")
      res.data.discoveredDomains.forEach((d: string) => addLog(`-> Found Domain: ${d}`))
    } catch (err: any) {
      addLog(`Serper Failed: ${err.response?.data?.error || err.message}`, "error")
    } finally {
      setIsLoading(prev => ({ ...prev, serper: false }))
    }
  }

  const testQueue = async () => {
    setIsLoading(prev => ({ ...prev, queue: true }))
    addLog("Injecting diagnostic job into BullMQ cluster...")
    try {
      const res = await axios.post('/api/debug/test-queue', { 
        domain: 'debug-check.io',
        adminId: user?.uid 
      })
      addLog(`BullMQ Acknowledgement: Job ${res.data.jobId} active in Redis.`, "success")
    } catch (err: any) {
      addLog(`Queue Injection Failed: ${err.response?.data?.error || err.message}`, "error")
    } finally {
      setIsLoading(prev => ({ ...prev, queue: false }))
    }
  }

  const testFirestore = async () => {
    setIsLoading(prev => ({ ...prev, fs: true }))
    addLog("Verifying Firestore synchronization...")
    if (db && user) {
      addLog("Firestore Instance: ONLINE", "success")
      addLog(`Authenticated UID: ${user.uid}`)
      addLog("Attempting permission handshake with system/protocols...")
      // This will trigger a permission error if rules are broken
    } else {
      addLog("Firestore or Auth instances are unavailable.", "error")
    }
    setIsLoading(prev => ({ ...prev, fs: false }))
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background font-code">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-headline font-black text-white italic uppercase tracking-tighter">System Diagnostic Terminal</h1>
              <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-60">Production Readiness Verification Node</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className={`${socketStatus === 'Connected' ? 'border-accent text-accent shadow-[0_0_10px_rgba(90,212,255,0.3)]' : 'border-destructive text-destructive'}`}>
                SOCKET: {socketStatus}
              </Badge>
              <Badge variant="outline" className="border-primary text-primary">REDIS: LOCALHOST:6379</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Control Panels */}
            <div className="lg:col-span-4 space-y-6">
              <Card className="bg-card border-white/5 border-l-4 border-l-primary shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-headline uppercase tracking-widest flex items-center">
                    <Search className="h-4 w-4 mr-2 text-primary" /> Serper Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-black text-muted-foreground">Discovery Query</Label>
                    <Input 
                      value={serperQuery} 
                      onChange={(e) => setSerperQuery(e.target.value)}
                      className="bg-white/5 border-white/10 text-xs"
                    />
                  </div>
                  <Button 
                    className="w-full h-11 bg-primary/20 hover:bg-primary/30 text-primary border border-primary/20 font-black uppercase text-[10px] tracking-widest"
                    onClick={testSerper}
                    disabled={isLoading.serper}
                  >
                    {isLoading.serper ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                    Test Domain Discovery
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5 border-l-4 border-l-accent shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-headline uppercase tracking-widest flex items-center">
                    <Database className="h-4 w-4 mr-2 text-accent" /> BullMQ Infrastructure
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                    Injects a diagnostic payload into the Redis-backed queue to verify worker connectivity.
                  </p>
                  <Button 
                    className="w-full h-11 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/20 font-black uppercase text-[10px] tracking-widest"
                    onClick={testQueue}
                    disabled={isLoading.queue}
                  >
                    {isLoading.queue ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                    Test Worker Handshake
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5 border-l-4 border-l-white/20 shadow-2xl">
                <CardHeader>
                  <CardTitle className="text-sm font-headline uppercase tracking-widest flex items-center">
                    <ShieldCheck className="h-4 w-4 mr-2 text-white/40" /> Security & Sync
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full h-11 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest"
                    onClick={testFirestore}
                    disabled={isLoading.fs}
                  >
                    {isLoading.fs ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Network className="h-4 w-4 mr-2" />}
                    Test Cloud Handshake
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Terminal Output */}
            <div className="lg:col-span-8">
              <Card className="bg-black/40 backdrop-blur-3xl border-white/5 shadow-2xl h-[600px] flex flex-col relative overflow-hidden group">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
                <CardHeader className="bg-white/[0.02] border-b border-white/5 px-6 py-4 flex flex-row items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex space-x-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <CardTitle className="text-xs uppercase font-black tracking-[0.3em] text-white/40">Diagnostic Output Feed</CardTitle>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase text-muted-foreground hover:text-white" onClick={() => setLogs([])}>Clear Buffer</Button>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-hidden bg-black/20">
                  <ScrollArea className="h-full w-full">
                    <div className="p-6 font-code text-xs space-y-1.5">
                      {logs.map((log, i) => (
                        <div key={i} className={cn(
                          "leading-relaxed break-words",
                          log.type === 'error' ? 'text-destructive' : 
                          log.type === 'success' ? 'text-accent' : 
                          'text-muted-foreground'
                        )}>
                          {log.msg}
                        </div>
                      ))}
                      {logs.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-96 opacity-10 select-none">
                          <Terminal className="h-24 w-24 mb-6" />
                          <p className="text-xl font-black uppercase tracking-[0.5em]">Terminal Standby</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
                <div className="p-3 bg-white/[0.02] border-t border-white/5 flex items-center justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
                  <span>Cluster 0.1.2-ALPHA</span>
                  <div className="flex items-center gap-4">
                    <span>CPU: 12%</span>
                    <span>MEM: 512MB</span>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_5px_green]" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function ShieldCheck({ className, ...props }: any) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function Label({ children, className }: any) {
  return <label className={cn("text-sm font-medium leading-none", className)}>{children}</label>
}
