
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { 
  Folder, 
  Play, 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  Globe, 
  Target, 
  Cpu, 
  Activity,
  TrendingUp,
  Loader2,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router])

  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "admins", user.uid, "campaigns")
  }, [db, user])

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "admins", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(8)
    )
  }, [db, user])

  const { data: campaigns, isLoading: campaignsLoading } = useCollection(campaignsQuery)
  const { data: logData, isLoading: logsLoading } = useCollection(notificationsQuery)

  if (isUserLoading || campaignsLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="animate-spin h-12 w-12 text-primary mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/60">Syncing Intelligence...</p>
      </div>
    )
  }

  const activeCount = campaigns?.filter(c => c.status === 'Running').length || 0
  const totalEmails = campaigns?.reduce((acc, c) => acc + (c.totalEmailsExtracted || 0), 0) || 0
  const totalValids = campaigns?.reduce((acc, c) => acc + (c.validEmailsCount || 0), 0) || 0
  const totalDomains = campaigns?.reduce((acc, c) => acc + (c.totalDomainsFetched || 0), 0) || 0
  const totalFlagged = campaigns?.reduce((acc, c) => acc + (c.flaggedEmailsCount || 0), 0) || 0

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Folder': return Folder
      case 'Play': return Play
      case 'Mail': return Mail
      case 'CheckCircle': return CheckCircle
      case 'AlertTriangle': return AlertTriangle
      case 'Globe': return Globe
      case 'Target': return Target
      case 'Cpu': return Cpu
      default: return Folder
    }
  }

  const liveStats = [
    { label: 'Cluster Registry', value: campaigns?.length || 0, change: 'Lifetime', icon: 'Folder' },
    { label: 'Active Clusters', value: activeCount, change: 'Live Now', icon: 'Play', color: 'text-accent' },
    { label: 'Identities Yielded', value: totalEmails.toLocaleString(), change: 'Gross Extraction', icon: 'Mail' },
    { label: 'Verified Entities', value: totalValids.toLocaleString(), change: 'MX Handshake', icon: 'CheckCircle' },
    { label: 'Flagged Leads', value: totalFlagged.toLocaleString(), change: 'Review Queue', icon: 'AlertTriangle', color: 'text-destructive' },
    { label: 'Precision Rate', value: totalEmails > 0 ? `${Math.floor((totalValids/totalEmails)*100)}%` : '0%', change: 'Accuracy', icon: 'Target' },
  ]

  // Performance chart data from real campaign results
  const chartPerformanceData = campaigns?.slice(-7).map(c => ({
    name: c.name.slice(0, 12),
    emails: c.totalEmailsExtracted || 0,
    valid: c.validEmailsCount || 0,
  })) || []

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        <Header />
        
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-headline font-black text-white mb-2 tracking-tighter italic uppercase">Command Center</h1>
              <p className="text-muted-foreground text-lg font-medium opacity-60">Strategic extraction intelligence and multi-node throughput.</p>
            </div>
            <div className="hidden md:flex items-center space-x-4 bg-card/50 px-6 py-3 rounded-2xl border border-white/5 backdrop-blur-xl">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Neural Engine Operational</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveStats.map((stat, idx) => {
              const Icon = getIcon(stat.icon)
              return (
                <Card key={idx} className="bg-card border-white/5 shadow-2xl hover:border-primary/40 transition-all duration-500 group overflow-hidden relative border-l-4 border-l-transparent hover:border-l-primary">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-colors" />
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-4 rounded-2xl ${stat.color ? 'bg-background/50' : 'bg-primary/5'} group-hover:scale-110 transition-transform duration-500 border border-white/5`}>
                        <Icon className={`h-7 w-7 ${stat.color || 'text-primary'}`} />
                      </div>
                      <Badge variant="secondary" className="bg-white/5 text-[9px] uppercase font-black tracking-widest px-3 py-1 border border-white/5 text-muted-foreground">
                        {stat.change}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{stat.label}</p>
                      <h3 className="text-5xl font-headline font-black text-white tabular-nums tracking-tighter">{stat.value}</h3>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 bg-card border-white/5 shadow-2xl overflow-hidden border-t-2 border-t-primary/20">
              <CardHeader className="flex flex-row items-center justify-between pb-10 bg-white/[0.01] border-b border-white/5 p-8">
                <CardTitle className="text-2xl font-headline font-black italic flex items-center uppercase tracking-tighter">
                  <TrendingUp className="h-6 w-6 mr-4 text-primary" /> Extraction Throughput
                </CardTitle>
                <div className="flex items-center space-x-2">
                   <div className="h-2 w-2 rounded-full bg-primary" />
                   <span className="text-[9px] font-black uppercase text-muted-foreground">Real-time Snapshots</span>
                </div>
              </CardHeader>
              <CardContent className="h-[400px] p-8">
                {chartPerformanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPerformanceData}>
                      <defs>
                        <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.02)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 800 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 800 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(5, 5, 5, 0.9)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }} 
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      />
                      <Area type="monotone" dataKey="emails" stroke="hsl(var(--primary))" strokeWidth={4} fillOpacity={1} fill="url(#colorEmails)" animationDuration={2000} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
                    <Activity className="h-16 w-16 mb-6 opacity-5 animate-pulse" />
                    <p className="text-lg font-headline font-bold uppercase tracking-widest text-white/20">Waiting for Cluster Data...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 shadow-2xl flex flex-col border-t-2 border-t-accent/20">
              <CardHeader className="bg-white/[0.01] border-b border-white/5 p-8">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-headline font-black italic flex items-center uppercase tracking-tighter">
                     Live System Log
                  </CardTitle>
                  <Activity className="h-6 w-6 text-accent animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <div className="divide-y divide-white/5">
                  {logData?.map((log) => (
                    <div key={log.id} className="p-6 flex items-start space-x-5 hover:bg-white/[0.02] transition-all group cursor-default">
                      <div className="mt-1.5 h-2.5 w-2.5 rounded-full bg-accent group-hover:scale-150 transition-transform duration-500 shadow-[0_0_8px_rgba(90,212,255,0.5)]" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{log.title}</p>
                          <span className="text-[9px] text-muted-foreground font-black uppercase flex items-center">
                            <Clock className="h-3 w-3 mr-1.5" />
                            {log.createdAt ? formatDistanceToNow(log.createdAt.toDate()) + ' ago' : 'Incoming'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 font-medium italic opacity-80">{log.description}</p>
                      </div>
                    </div>
                  ))}
                  {(!logData || logData.length === 0) && !logsLoading && (
                    <div className="p-12 text-center text-muted-foreground">
                       <p className="text-xs font-black uppercase tracking-widest opacity-20 italic">No telemetry detected.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
