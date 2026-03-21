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
      limit(6)
    )
  }, [db, user])

  const { data: campaigns, isLoading } = useCollection(campaignsQuery)
  const { data: logData } = useCollection(notificationsQuery)

  if (isUserLoading || isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin h-10 w-10 text-primary" />
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
    { label: 'Total Campaigns', value: campaigns?.length || 0, change: 'Lifetime', icon: 'Folder' },
    { label: 'Active Clusters', value: activeCount, change: 'Live', icon: 'Play', color: 'text-accent' },
    { label: 'Emails Extracted', value: totalEmails.toLocaleString(), change: 'Gross', icon: 'Mail' },
    { label: 'Valid Entities', value: totalValids.toLocaleString(), change: 'Verified', icon: 'CheckCircle' },
    { label: 'Flagged Leads', value: totalFlagged.toLocaleString(), change: 'Review Required', icon: 'AlertTriangle', color: 'text-destructive' },
    { label: 'Success Rate', value: totalEmails > 0 ? `${Math.floor((totalValids/totalEmails)*100)}%` : '0%', change: 'Quality', icon: 'Target' },
  ]

  // Transform real campaign data for the performance chart
  const chartPerformanceData = campaigns?.slice(0, 7).map(c => ({
    name: c.name.slice(0, 10),
    emails: c.totalEmailsExtracted || 0,
    domains: c.totalDomainsFetched || 0,
  })) || []

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        <Header />
        
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-headline font-bold text-white mb-2">Command Center</h1>
              <p className="text-muted-foreground text-lg italic">Strategic intelligence and extraction throughput.</p>
            </div>
            <div className="hidden md:flex items-center space-x-3 bg-card p-2 rounded-xl border border-white/5">
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Global Engine Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveStats.map((stat, idx) => {
              const Icon = getIcon(stat.icon)
              return (
                <Card key={idx} className="bg-card border-white/5 shadow-xl hover:border-primary/50 transition-all duration-300 group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover:bg-primary/10 transition-colors" />
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-xl ${stat.color ? 'bg-background' : 'bg-primary/10'} group-hover:scale-110 transition-transform`}>
                        <Icon className={`h-6 w-6 ${stat.color || 'text-primary'}`} />
                      </div>
                      <Badge variant="secondary" className="bg-white/5 text-[10px] uppercase font-bold tracking-wider px-2 py-1 border-white/5">
                        {stat.change}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-tighter">{stat.label}</p>
                      <h3 className="text-4xl font-headline font-bold text-white tabular-nums tracking-tighter">{stat.value}</h3>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 bg-card border-white/5 shadow-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-8 bg-white/[0.02] border-b border-white/5">
                <CardTitle className="text-xl font-headline font-semibold flex items-center">
                  <TrendingUp className="h-5 w-5 mr-3 text-primary" /> Extraction Performance
                </CardTitle>
                <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[8px] font-bold">Live Snapshots</Badge>
              </CardHeader>
              <CardContent className="h-[350px] p-6">
                {chartPerformanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartPerformanceData}>
                      <defs>
                        <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 700 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }} 
                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="emails" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorEmails)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground">
                    <Activity className="h-12 w-12 mb-4 opacity-10 animate-pulse" />
                    <p className="text-sm italic">Engine is waiting for primary telemetry...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 shadow-2xl flex flex-col">
              <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-headline font-semibold flex items-center">
                     Live Engine Log
                  </CardTitle>
                  <Activity className="h-5 w-5 text-accent animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <div className="divide-y divide-white/5">
                  {logData?.map((log) => (
                    <div key={log.id} className="p-4 flex items-start space-x-4 hover:bg-white/[0.02] transition-colors group">
                      <div className="mt-1 h-2 w-2 rounded-full bg-accent group-hover:scale-125 transition-transform" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">{log.title}</p>
                          <span className="text-[9px] text-muted-foreground font-medium flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {log.createdAt ? formatDistanceToNow(log.createdAt.toDate()) + ' ago' : 'Recent'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-1">{log.description}</p>
                      </div>
                    </div>
                  ))}
                  {(!logData || logData.length === 0) && (
                    <div className="p-8 text-center text-muted-foreground">
                       <p className="text-xs italic">No real-time logs detected in this cluster.</p>
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
