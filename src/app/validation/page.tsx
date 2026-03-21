
"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { ShieldCheck, Mail, CheckCircle, AlertCircle, Search, Filter, Database, MoreHorizontal, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"

export default function ValidationPage() {
  const { user } = useUser()
  const db = useFirestore()
  const [selected, setSelected] = useState<any | null>(null)

  // Aggregating real data from campaigns
  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "admins", user.uid, "campaigns")
  }, [db, user])

  const { data: campaigns, isLoading } = useCollection(campaignsQuery)

  const totalValids = campaigns?.reduce((acc, c) => acc + (c.validEmailsCount || 0), 0) || 0
  const totalFlagged = campaigns?.reduce((acc, c) => acc + (c.flaggedEmailsCount || 0), 0) || 0
  const totalExtracted = campaigns?.reduce((acc, c) => acc + (c.totalEmailsExtracted || 0), 0) || 0
  const successRate = totalExtracted > 0 ? Math.floor((totalValids / totalExtracted) * 100) : 0

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-headline font-bold text-white mb-1">Quality Control</h1>
              <p className="text-muted-foreground">Verify and validate extraction accuracy across campaigns.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-card border-white/5 border-l-4 border-l-primary shadow-xl">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Validated Emails</p>
                <h3 className="text-3xl font-headline font-bold text-white">{totalValids.toLocaleString()}</h3>
                <p className="text-xs text-accent mt-2 font-medium flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" /> {successRate}% Success Rate
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-white/5 border-l-4 border-l-destructive shadow-xl">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Flagged Emails</p>
                <h3 className="text-3xl font-headline font-bold text-white">{totalFlagged.toLocaleString()}</h3>
                <p className="text-xs text-destructive mt-2 font-medium flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> MX Record Issues
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-white/5 border-l-4 border-l-accent shadow-xl">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Extraction Pipeline</p>
                <h3 className="text-3xl font-headline font-bold text-white">{campaigns?.length || 0}</h3>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Active Deployment Nodes</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
               <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search campaign validation..." className="pl-9 bg-secondary/30 border-white/10" />
              </div>
            </CardHeader>
            <CardContent className="p-0">
               {isLoading ? (
                 <div className="p-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
               ) : (
                 <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="font-headline">Campaign Descriptor</TableHead>
                      <TableHead className="font-headline">Valid</TableHead>
                      <TableHead className="font-headline">Flagged</TableHead>
                      <TableHead className="font-headline">Accuracy</TableHead>
                      <TableHead className="font-headline text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns?.map((row) => {
                      const acc = row.totalEmailsExtracted > 0 ? Math.floor((row.validEmailsCount / row.totalEmailsExtracted) * 100) : 0
                      return (
                        <TableRow 
                          key={row.id} 
                          className="border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                          onClick={() => setSelected(row)}
                        >
                          <TableCell className="font-bold text-white">{row.name}</TableCell>
                          <TableCell>
                            <Badge variant="default" className="bg-primary/20 text-primary border-0">{(row.validEmailsCount || 0).toLocaleString()}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="bg-destructive/20 text-destructive border-0">{(row.flaggedEmailsCount || 0).toLocaleString()}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                               <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                 <div 
                                   className="h-full bg-accent" 
                                   style={{ width: `${acc}%` }}
                                 />
                               </div>
                               <span className="text-xs font-medium text-white">{acc}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">{row.status}</Badge>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
               )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-[500px] sm:max-w-lg bg-card border-l-white/10">
          <SheetHeader className="mb-8">
            <div className="p-3 bg-accent/10 rounded-xl mb-4 inline-block w-fit">
              <ShieldCheck className="h-8 w-8 text-accent" />
            </div>
            <SheetTitle className="text-3xl font-headline font-bold text-white">{selected?.name}</SheetTitle>
            <SheetDescription>Real-time validation snapshot for this campaign cluster.</SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-1 bg-secondary/50">
              <TabsTrigger value="stats">Deployment Metrics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="pt-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Success Rate</p>
                  <p className="text-2xl font-headline font-bold text-accent">
                    {selected?.totalEmailsExtracted > 0 ? Math.floor((selected.validEmailsCount / selected.totalEmailsExtracted) * 100) : 0}%
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Total Yield</p>
                  <p className="text-2xl font-headline font-bold text-white">{(selected?.totalEmailsExtracted || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-widest">Target Configuration</h4>
                <div className="flex flex-wrap gap-2">
                  {selected?.keywords?.map((k: string) => <Badge key={k} variant="secondary" className="bg-primary/10 text-primary">{k}</Badge>)}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  )
}
