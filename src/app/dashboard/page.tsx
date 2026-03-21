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
  ShieldCheck
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { stats, recentCampaigns, chartData, activityLog } from "@/app/lib/mock-data"
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell
} from "recharts"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
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
            <div className="flex gap-4">
               <Card className="bg-secondary/30 border-white/5 px-6 py-3 flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Threads</p>
                    <p className="text-lg font-headline font-bold text-accent">1,245 / 5k</p>
                  </div>
                  <div className="h-8 w-px bg-white/10" />
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Uptime</p>
                    <p className="text-lg font-headline font-bold text-primary">99.98%</p>
                  </div>
               </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
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
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 bg-card border-white/5 shadow-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-8 bg-white/[0.02] border-b border-white/5">
                <div>
                  <CardTitle className="text-xl font-headline font-semibold flex items-center">
                    <TrendingUp className="h-5 w-5 mr-3 text-primary" /> Extraction Performance
                  </CardTitle>
                  <CardDescription>Valid email yields vs total domain discovery.</CardDescription>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-xs font-bold text-primary">
                    <span className="w-3 h-3 rounded-sm bg-primary mr-2" /> Emails
                  </div>
                  <div className="flex items-center text-xs font-bold text-accent">
                    <span className="w-3 h-3 rounded-sm bg-accent mr-2" /> Domains
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[350px] p-6">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDomains" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                      itemStyle={{ fontWeight: 700 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="domains" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      fillOpacity={1} 
                      fill="url(#colorDomains)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="emails" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorEmails)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 shadow-2xl flex flex-col">
              <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-headline font-semibold">Live Engine Log</CardTitle>
                    <CardDescription>Real-time system telemetry.</CardDescription>
                  </div>
                  <Activity className="h-5 w-5 text-accent animate-pulse" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-6">
                <div className="space-y-6">
                  {activityLog.map((log) => (
                    <div key={log.id} className="flex items-start space-x-4 group cursor-default">
                      <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor] ${log.action === 'Scraped' ? 'text-accent bg-accent' : log.action === 'Validated' ? 'text-primary bg-primary' : log.action === 'Queued' ? 'text-muted-foreground bg-muted-foreground' : 'text-destructive bg-destructive'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <p className="text-[10px] font-black text-white uppercase tracking-wider">{log.action}</p>
                          <span className="text-[10px] text-muted-foreground font-code bg-white/5 px-1.5 py-0.5 rounded">{log.time}</span>
                        </div>
                        <p className="text-sm font-bold text-white truncate group-hover:text-primary transition-colors">{log.target}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 italic">{log.result}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="ghost" className="w-full mt-6 text-xs text-muted-foreground hover:text-white border border-white/5">View Full Infrastructure Log</Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Card className="lg:col-span-3 bg-card border-white/5 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between bg-white/[0.02] border-b border-white/5">
                <div>
                  <CardTitle className="text-xl font-headline font-semibold">Deployment Overview</CardTitle>
                  <CardDescription>Status and metrics of recent campaign runs.</CardDescription>
                </div>
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 font-bold">Manage All</Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] border-b border-white/5">
                        <th className="py-4 px-6">Campaign Descriptor</th>
                        <th className="py-4 px-6">Health</th>
                        <th className="py-4 px-6">Domain Index</th>
                        <th className="py-4 px-6">Extracted</th>
                        <th className="py-4 px-6">Live Progress</th>
                        <th className="py-4 px-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentCampaigns.map((camp) => (
                        <tr key={camp.id} className="group hover:bg-white/[0.03] transition-colors">
                          <td className="py-5 px-6 font-bold text-white text-sm">{camp.name}</td>
                          <td className="py-5 px-6">
                            <Badge variant={camp.status === 'Completed' ? 'default' : camp.status === 'Running' ? 'secondary' : 'outline'} className="text-[10px] font-bold px-2 py-0.5 rounded-sm">
                              {camp.status}
                            </Badge>
                          </td>
                          <td className="py-5 px-6 text-sm text-muted-foreground tabular-nums">{camp.domains.toLocaleString()}</td>
                          <td className="py-5 px-6 text-sm text-white font-bold tabular-nums">{camp.emails.toLocaleString()}</td>
                          <td className="py-5 px-6 w-48">
                            <div className="space-y-2">
                              <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                                <span>{camp.progress}%</span>
                                <span>{camp.status === 'Running' ? 'Active Workers' : 'Idle'}</span>
                              </div>
                              <Progress value={camp.progress} className={`h-1.5 bg-white/5 ${camp.status === 'Running' ? '[&>div]:bg-accent' : ''}`} />
                            </div>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white group-hover:bg-white/10">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 shadow-2xl overflow-hidden flex flex-col">
               <CardHeader className="bg-white/[0.02] border-b border-white/5">
                <CardTitle className="text-xl font-headline font-semibold flex items-center">
                  <ShieldCheck className="h-5 w-5 mr-3 text-accent" /> High-Value Entities
                </CardTitle>
                <CardDescription>Domains with highest extraction yields.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex-1 space-y-6">
                {[
                  { domain: 'google.com', count: 421, category: 'Tech Infrastructure', trend: '+5%' },
                  { domain: 'amazon.co.uk', count: 312, category: 'B2C Marketplace', trend: '+12%' },
                  { domain: 'stripe.com', count: 284, category: 'Fintech / SaaS', trend: '+2%' },
                  { domain: 'airbnb.com', count: 195, category: 'Travel & Lifestyle', trend: '+8%' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-primary/30 transition-all cursor-default group">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate group-hover:text-primary">{item.domain}</p>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-headline font-bold text-accent tabular-nums">{item.count}</p>
                      <p className="text-[10px] text-accent/60 font-black uppercase tracking-tighter">{item.trend}</p>
                    </div>
                  </div>
                ))}
                <Button variant="link" className="w-full text-xs text-primary font-bold">Analyze All High-Yield Domains</Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
