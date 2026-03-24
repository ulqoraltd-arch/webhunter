"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { LayoutDashboard, Play, Clock, CheckCircle, AlertTriangle, Search, Filter, Trash2, PlusCircle, Activity, ArrowUpRight, Ban, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, deleteDoc, doc, query, orderBy, updateDoc, serverTimestamp } from "firebase/firestore"
import { formatDistanceToNow, format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

export default function CampaignManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  const [searchTerm, setSearchTerm] = useState("")

  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(collection(db, "admins", user.uid, "campaigns"), orderBy("createdAt", "desc"))
  }, [db, user])

  const { data: campaigns, isLoading } = useCollection(campaignsQuery)

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will purge all extracted data for this cluster.")) return
    try {
      await deleteDoc(doc(db, "admins", user!.uid, "campaigns", id))
      toast({ title: "Cluster Decommissioned", description: "All data nodes have been purged." })
    } catch (err) {
      toast({ title: "Purge Failed", variant: "destructive" })
    }
  }

  const handleCancelScheduled = async (id: string) => {
    try {
      await updateDoc(doc(db, "admins", user!.uid, "campaigns", id), {
        status: "Cancelled",
        updatedAt: serverTimestamp()
      })
      toast({ title: "Mission Aborted", description: "Scheduled activation was cancelled." })
    } catch (err) {
      toast({ title: "Cancellation Failed", variant: "destructive" })
    }
  }

  const filteredCampaigns = campaigns?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.keywords.some((k: string) => k.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (isUserLoading) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-headline font-bold text-white mb-2 tracking-tighter">Campaign Registry</h1>
              <p className="text-muted-foreground text-lg">Manage, track, and monitor all active and historical clusters.</p>
            </div>
            <Button onClick={() => router.push('/campaigns/new')} className="bg-primary hover:bg-primary/90 h-12 px-6 font-black uppercase tracking-widest">
              <PlusCircle className="mr-2 h-5 w-5" /> New Mission
            </Button>
          </div>

          <Card className="bg-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/5">
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Filter by name or keyword..." 
                  className="pl-11 h-12 bg-secondary/30 border-white/10" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="h-10 px-4 text-xs font-black uppercase tracking-widest border-white/10">
                  Total: {campaigns?.length || 0}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredCampaigns?.map((camp) => (
                  <Card key={camp.id} className="bg-background/50 border-white/5 hover:border-primary/30 transition-all group overflow-hidden relative">
                    <div className={cn(
                      "absolute top-0 left-0 w-full h-1",
                      camp.status === 'Running' ? 'bg-accent animate-pulse' : 
                      camp.status === 'Completed' ? 'bg-green-500' : 
                      camp.status === 'Scheduled' ? 'bg-primary' : 'bg-muted'
                    )} />
                    
                    <CardContent className="p-6 space-y-6">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="text-xl font-headline font-bold text-white group-hover:text-primary transition-colors truncate max-w-[200px]">{camp.name}</h3>
                          <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                            {camp.createdAt ? formatDistanceToNow(camp.createdAt.toDate()) + ' ago' : 'Processing...'}
                          </p>
                        </div>
                        <Badge className={cn(
                          "text-[10px] font-black px-2 py-0.5 border-0 tracking-tighter uppercase",
                          camp.status === 'Running' ? 'bg-accent/20 text-accent' : 
                          camp.status === 'Completed' ? 'bg-green-500/20 text-green-400' : 
                          camp.status === 'Scheduled' ? 'bg-primary/20 text-primary' : 'bg-muted/20 text-muted-foreground'
                        )}>
                          {camp.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Target Quota</p>
                          <p className="text-lg font-headline font-bold text-white">{camp.targetEmailCount}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Yielded</p>
                          <p className="text-lg font-headline font-bold text-accent">{camp.validEmailsCount || 0}</p>
                        </div>
                      </div>

                      {camp.status === 'Running' && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
                            <span>Extraction Progress</span>
                            <span>{Math.floor((camp.validEmailsCount / camp.targetEmailCount) * 100)}%</span>
                          </div>
                          <Progress value={(camp.validEmailsCount / camp.targetEmailCount) * 100} className="h-1.5 bg-white/5" />
                        </div>
                      )}

                      {camp.status === 'Scheduled' && (
                        <div className="flex items-center text-[10px] font-black text-primary uppercase bg-primary/5 p-3 rounded-lg border border-primary/10">
                          <Calendar className="h-3 w-3 mr-2" />
                          LAUNCH: {camp.scheduledDateTime ? format(new Date(camp.scheduledDateTime), "MMM d, HH:mm") : 'TBD'}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        {camp.status === 'Running' ? (
                          <Button 
                            className="flex-1 bg-accent/10 text-accent hover:bg-accent/20 border border-accent/20 h-10 font-black text-[10px] uppercase tracking-widest"
                            onClick={() => router.push(`/campaigns/progress?camp=${camp.id}&run=${camp.lastRunId}`)}
                          >
                            <Activity className="mr-2 h-3 w-3" /> Live Feed
                          </Button>
                        ) : camp.status === 'Scheduled' ? (
                          <Button 
                            variant="outline"
                            className="flex-1 border-white/10 hover:bg-destructive/10 hover:text-destructive h-10 font-black text-[10px] uppercase tracking-widest"
                            onClick={() => handleCancelScheduled(camp.id)}
                          >
                            <Ban className="mr-2 h-3 w-3" /> Cancel
                          </Button>
                        ) : (
                          <Button 
                            variant="outline"
                            className="flex-1 border-white/10 hover:bg-primary/10 h-10 font-black text-[10px] uppercase tracking-widest"
                            onClick={() => router.push(`/results?camp=${camp.id}`)}
                          >
                            <ArrowUpRight className="mr-2 h-3 w-3" /> Results
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(camp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!filteredCampaigns || filteredCampaigns.length === 0) && !isLoading && (
                  <div className="col-span-full py-20 text-center space-y-4">
                    < ban className="h-16 w-16 mx-auto opacity-10" />
                    <p className="text-muted-foreground font-black uppercase tracking-widest opacity-40">No active clusters in registry.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
