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
  ArrowUpRight,
  MoreVertical,
  Activity
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { stats, recentCampaigns, chartData, activityLog } from "@/app/lib/mock-data"
import { 
  LineChart, 
  Line, 
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
              <h1 className="text-3xl font-headline font-bold text-white mb-1">Command Center</h1>
              <p className="text-muted-foreground">Real-time overview of your extraction engine.</p>
            </div>
            <div className="flex space-x-3">
              <Badge variant="outline" className="px-3 py-1 border-white/10 bg-white/5 text-xs">
                Uptime: 99.9%
              </Badge>
              <Badge variant="outline" className="px-3 py-1 border-white/10 bg-white/5 text-xs">
                Last Backup: 2h ago
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
              const Icon = getIcon(stat.icon)
              return (
                <Card key={idx} className="bg-card border-white/5 shadow-xl hover:border-primary/50 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-lg ${stat.color ? 'bg-background' : 'bg-primary/10'}`}>
                        <Icon className={`h-5 w-5 ${stat.color || 'text-primary'}`} />
                      </div>
                      <Badge variant="secondary" className="bg-white/5 text-[10px] uppercase font-bold tracking-wider">
                        {stat.change}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <h3 className="text-2xl font-headline font-bold text-white">{stat.value}</h3>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 bg-card border-white/5 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-8">
                <div>
                  <CardTitle className="text-xl font-headline font-semibold">Email Extraction Performance</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Daily trend of extracted valid emails</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center text-xs">
                    <span className="w-2 h-2 rounded-full bg-primary mr-2" /> Emails
                  </div>
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      itemStyle={{ color: 'white' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="emails" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorEmails)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 shadow-2xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-headline font-semibold">Live Engine Log</CardTitle>
                  <Activity className="h-4 w-4 text-accent animate-pulse" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {activityLog.map((log) => (
                    <div key={log.id} className="flex items-start space-x-4">
                      <div className={`mt-1 h-2 w-2 rounded-full ${log.action === 'Scraped' ? 'bg-accent' : log.action === 'Validated' ? 'bg-primary' : 'bg-destructive'}`} />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-bold text-white uppercase tracking-tighter">{log.action}</p>
                          <span className="text-[10px] text-muted-foreground font-code">{log.time}</span>
                        </div>
                        <p className="text-sm font-medium text-white truncate">{log.target}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{log.result}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Card className="lg:col-span-3 bg-card border-white/5 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-headline font-semibold">Recent Campaigns</CardTitle>
                <Badge variant="outline" className="cursor-pointer hover:bg-white/5">View All</Badge>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-white/5">
                        <th className="pb-4 px-2">Campaign Name</th>
                        <th className="pb-4 px-2">Status</th>
                        <th className="pb-4 px-2">Domains</th>
                        <th className="pb-4 px-2">Emails</th>
                        <th className="pb-4 px-2">Progress</th>
                        <th className="pb-4 px-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentCampaigns.map((camp) => (
                        <tr key={camp.id} className="group hover:bg-white/5 transition-colors">
                          <td className="py-4 px-2 font-medium text-white">{camp.name}</td>
                          <td className="py-4 px-2">
                            <Badge variant={camp.status === 'Completed' ? 'default' : camp.status === 'Running' ? 'secondary' : 'outline'} className="text-[10px]">
                              {camp.status}
                            </Badge>
                          </td>
                          <td className="py-4 px-2 text-sm text-muted-foreground">{camp.domains.toLocaleString()}</td>
                          <td className="py-4 px-2 text-sm text-white font-bold">{camp.emails.toLocaleString()}</td>
                          <td className="py-4 px-2 w-48">
                            {camp.status === 'Running' ? (
                              <div className="space-y-1.5">
                                <Progress value={camp.progress} className="h-1.5 bg-white/5" />
                                <span className="text-[10px] text-muted-foreground">{camp.progress}%</span>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="py-4 px-2">
                            <button className="p-1 hover:bg-white/10 rounded-md transition-colors">
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5 shadow-2xl overflow-hidden">
               <CardHeader>
                <CardTitle className="text-xl font-headline font-semibold">Top Performers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { domain: 'google.com', count: 421, category: 'Tech' },
                  { domain: 'amazon.co.uk', count: 312, category: 'Retail' },
                  { domain: 'stripe.com', count: 284, category: 'Fintech' },
                  { domain: 'airbnb.com', count: 195, category: 'Travel' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{item.domain}</p>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-accent">{item.count}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Emails</p>
                    </div>
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