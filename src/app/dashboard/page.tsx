
"use client"

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
  ArrowUpRight,
  MoreVertical,
  TrendingUp,
  ShieldCheck,
  Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { chartData, activityLog } from "@/app/lib/mock-data"
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
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"

export default function DashboardPage() {
  const { user } = useUser()
  const db = useFirestore()

  // Real-time aggregate data
  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "admins", user.uid, "campaigns")
  }, [db, user])

  const { data: campaigns, isLoading } = useCollection(campaignsQuery)

  const activeCount = campaigns?.filter(c => c.status === 'Running').length || 0
  const totalEmails = campaigns?.reduce((acc, c) => acc + (c.totalEmailsExtracted || 0), 0) || 0
  const totalValids = campaigns?.reduce((acc, c) => acc + (c.validEmailsCount || 0), 0) || 0
  const totalDomains = campaigns?.reduce((acc, c) => acc + (c.totalDomainsFetched || 0), 0) || 0

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
    { label: 'Domains Scanned', value: totalDomains.toLocaleString(), change: 'Discovery', icon: 'Globe' },
    { label: 'Success Rate', value: totalEmails > 0 ? `${Math.floor((totalValids/totalEmails)*100)}%` : '0%', change: 'Quality', icon: 'Target' },
  ]

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
        <Header />
        
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-headline font-bold text-white mb-2">Command Center</h1>
              <p className="text-muted-foreground text-lg">Real-time infrastructure health and extraction metrics.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full py-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
            ) : (
              liveStats.map((stat, idx) => {
                const Icon = getIcon(stat.icon)
                return (
                  <Card key={idx} className="bg-card border-white/5 shadow-xl hover:border-primary/50 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-xl ${stat.color ? 'bg-background' : 'bg-primary/10'} group-hover:scale-110 transition-transform`}>
                          <Icon className={`h-6 w-6 ${stat.color || 'text-primary'}`} />
                        </div>
                        <Badge variant="secondary" className="bg-white/5 text-[10px] uppercase font-bold tracking-wider px-2 py-1">
                          {stat.change}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <h3 className="text-3xl font-headline font-bold text-white tabular-nums tracking-tighter">{stat.value}</h3>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 bg-card border-white/5 shadow-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-8 bg-white/[0.02] border-b border-white/5">
                <div>
                  <CardTitle className="text-xl font-headline font-semibold flex items-center">
                    <TrendingUp className="h-5 w-5 mr-3 text-primary" /> Extraction Performance
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="h-[350px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px' }} />
                    <Area type="monotone" dataKey="emails" stroke="hsl(var(--primary))" strokeWidth={4} fill="hsl(var(--primary)/0.1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 shadow-2xl flex flex-col">
              <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-headline font-semibold">Live Engine Log</CardTitle>
                  </div>
                  <Activity className="h-5 w-5 text-accent animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-6">
                <div className="space-y-6">
                  {activityLog.map((log) => (
                    <div key={log.id} className="flex items-start space-x-4">
                      <div className="mt-1.5 h-2 w-2 rounded-full bg-accent" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-white uppercase">{log.action}</p>
                        <p className="text-sm font-bold text-white truncate">{log.target}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
