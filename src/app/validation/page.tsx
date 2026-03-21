"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { ShieldCheck, Mail, CheckCircle, AlertCircle, Search, Filter, Database, MoreHorizontal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const mockValidationData = [
  { domain: 'google.com', campaign: 'Tech Giants', valid: 420, invalid: 5, total: 425 },
  { domain: 'amazon.com', campaign: 'E-commerce', valid: 310, invalid: 12, total: 322 },
  { domain: 'stripe.com', campaign: 'Fintech', valid: 280, invalid: 3, total: 283 },
  { domain: 'vercel.com', campaign: 'SaaS', valid: 156, invalid: 8, total: 164 },
  { domain: 'meta.com', campaign: 'Tech Giants', valid: 120, invalid: 22, total: 142 },
]

export default function ValidationPage() {
  const [selected, setSelected] = useState<typeof mockValidationData[0] | null>(null)

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
            <Card className="bg-card border-white/5 border-l-4 border-l-primary">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Validated Emails</p>
                <h3 className="text-3xl font-headline font-bold text-white">72,109</h3>
                <p className="text-xs text-accent mt-2 font-medium flex items-center">
                  <CheckCircle className="h-3 w-3 mr-1" /> 85.6% Success Rate
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-white/5 border-l-4 border-l-destructive">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Flagged Emails</p>
                <h3 className="text-3xl font-headline font-bold text-white">12,122</h3>
                <p className="text-xs text-destructive mt-2 font-medium flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" /> MX Record Issues
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card border-white/5 border-l-4 border-l-accent">
              <CardContent className="p-6">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Verification Queue</p>
                <h3 className="text-3xl font-headline font-bold text-white">4,231</h3>
                <p className="text-xs text-muted-foreground mt-2 font-medium">Processing Batch #422</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
               <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search domain validation..." className="pl-9 bg-secondary/30 border-white/10" />
              </div>
              <div className="flex space-x-3">
                <Button variant="outline" size="sm" className="border-white/10">
                  <Filter className="h-4 w-4 mr-2" /> All Campaigns
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
               <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="font-headline">Domain Identity</TableHead>
                    <TableHead className="font-headline">Source Campaign</TableHead>
                    <TableHead className="font-headline">Valid</TableHead>
                    <TableHead className="font-headline">Flagged</TableHead>
                    <TableHead className="font-headline">Accuracy</TableHead>
                    <TableHead className="font-headline">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockValidationData.map((row) => (
                    <TableRow 
                      key={row.domain} 
                      className="border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
                      onClick={() => setSelected(row)}
                    >
                      <TableCell className="font-bold text-white">{row.domain}</TableCell>
                      <TableCell className="text-muted-foreground">{row.campaign}</TableCell>
                      <TableCell>
                        <Badge variant="default" className="bg-primary/20 text-primary border-0">{row.valid}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="destructive" className="bg-destructive/20 text-destructive border-0">{row.invalid}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                           <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
                             <div 
                               className="h-full bg-accent" 
                               style={{ width: `${Math.floor((row.valid / row.total) * 100)}%` }}
                             />
                           </div>
                           <span className="text-xs font-medium text-white">{Math.floor((row.valid / row.total) * 100)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            <SheetTitle className="text-3xl font-headline font-bold text-white">{selected?.domain}</SheetTitle>
            <SheetDescription>Detailed validation breakdown for this extraction entity.</SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="valid" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
              <TabsTrigger value="valid" className="data-[state=active]:text-accent">Valid Emails ({selected?.valid})</TabsTrigger>
              <TabsTrigger value="flagged" className="data-[state=active]:text-destructive">Flagged ({selected?.invalid})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="valid" className="pt-6 space-y-4">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl border-l-accent border-l-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-accent" />
                    <div>
                      <p className="text-sm font-medium text-white">verified_contact_{i}@domain.com</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">MX Verified • Active</p>
                    </div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-accent" />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="flagged" className="pt-6 space-y-4">
               {[1,2,3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl border-l-destructive border-l-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-destructive" />
                    <div>
                      <p className="text-sm font-medium text-white">bounced_user_{i}@domain.com</p>
                      <p className="text-[10px] text-destructive/80 uppercase font-bold">SMTP Rejection • Error 550</p>
                    </div>
                  </div>
                  <AlertCircle className="h-4 w-4 text-destructive" />
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  )
}