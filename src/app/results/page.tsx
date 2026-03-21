
"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { 
  Search, 
  Filter, 
  Download, 
  Mail, 
  Globe, 
  CheckCircle,
  FileText,
  Loader2,
  X
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit } from "firebase/firestore"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function ResultsPage() {
  const { user } = useUser()
  const db = useFirestore()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDomain, setSelectedDomain] = useState<any | null>(null)

  // Fetch all campaigns for reference
  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "admins", user.uid, "campaigns")
  }, [db, user])

  const { data: campaigns } = useCollection(campaignsQuery)

  // Fetch real-time domains across the platform (simulated by showing most recent)
  // In production, we'd use a flat results collection for cross-campaign search
  const domainsQuery = useMemoFirebase(() => {
    if (!db || !user || !campaigns?.[0]) return null
    const firstCamp = campaigns[0]
    return collection(db, "admins", user.uid, "campaigns", firstCamp.id, "runs", firstCamp.lastRunId || "active", "domains")
  }, [db, user, campaigns])

  const { data: domains, isLoading: domainsLoading } = useCollection(domainsQuery)

  // Nested emails query for selected domain
  const emailsQuery = useMemoFirebase(() => {
    if (!db || !user || !selectedDomain) return null
    return collection(db, "admins", user.uid, "campaigns", selectedDomain.campaignId, "runs", selectedDomain.campaignRunId, "domains", selectedDomain.id, "emails")
  }, [db, user, selectedDomain])

  const { data: extractedEmails, isLoading: emailsLoading } = useCollection(emailsQuery)

  const filteredDomains = domains?.filter(d => 
    d.domainName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleExportDomain = (domain: any) => {
    const emailsStr = extractedEmails?.map(e => e.emailAddress).join('; ') || "Pending..."
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Domain,EmailsFound,Status,PagesScanned\n"
      + `${domain.domainName},"${emailsStr}",${domain.status},"${domain.pageUrls?.join(', ')}"`
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${domain.domainName}_export.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-headline font-bold text-white mb-1">Extraction Repository</h1>
              <p className="text-muted-foreground">Centralized database of all discovered domains and entities.</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90">
              <Download className="h-4 w-4 mr-2" /> Bulk Export All
            </Button>
          </div>

          <Card className="bg-card border-white/5">
            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search domains in current view..." 
                    className="pl-9 bg-secondary/30 border-white/10" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" className="border-white/10">
                  <Filter className="h-4 w-4 mr-2" /> Filter By Campaign
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing <span className="text-white font-bold">{filteredDomains?.length || 0}</span> Results
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {domainsLoading ? (
                <div className="p-20 flex flex-col items-center justify-center text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                  <p>Syncing repository data...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="w-[300px] font-headline">Domain</TableHead>
                      <TableHead className="font-headline">Source Campaign</TableHead>
                      <TableHead className="font-headline">Emails Found</TableHead>
                      <TableHead className="font-headline">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDomains?.map((result) => (
                      <TableRow 
                        key={result.id} 
                        className="border-white/5 cursor-pointer hover:bg-white/5 transition-colors group"
                        onClick={() => setSelectedDomain(result)}
                      >
                        <TableCell className="font-medium text-white flex items-center">
                           <Globe className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                           {result.domainName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {campaigns?.find(c => c.id === result.campaignId)?.name || 'Live Engine'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                            {result.emailCount}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <CheckCircle className={`h-3 w-3 mr-1.5 ${result.status === 'success' ? 'text-accent' : 'text-muted-foreground'}`} />
                            <span className="text-xs font-medium uppercase tracking-wider">{result.status}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!filteredDomains || filteredDomains.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground italic">
                          No data found in the current cluster range.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Sheet open={!!selectedDomain} onOpenChange={() => setSelectedDomain(null)}>
        <SheetContent className="w-[600px] sm:max-w-xl bg-card border-l-white/10 text-white p-0">
          <ScrollArea className="h-full">
            <div className="p-8 space-y-8">
              <SheetHeader>
                <div className="flex items-center justify-between">
                   <div className="p-3 bg-primary/10 rounded-xl">
                    <Globe className="h-8 w-8 text-primary" />
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => handleExportDomain(selectedDomain)}
                  >
                    <Download className="h-4 w-4 mr-2" /> Export CSV
                  </Button>
                </div>
                <SheetTitle className="text-3xl font-headline font-bold text-white">{selectedDomain?.domainName}</SheetTitle>
                <SheetDescription className="text-muted-foreground flex items-center">
                  Source: <span className="text-white ml-2">{campaigns?.find(c => c.id === selectedDomain?.campaignId)?.name}</span>
                </SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="emails" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
                  <TabsTrigger value="emails">Emails ({selectedDomain?.emailCount})</TabsTrigger>
                  <TabsTrigger value="pages">Pages Scanned</TabsTrigger>
                  <TabsTrigger value="meta">Metadata</TabsTrigger>
                </TabsList>
                
                <TabsContent value="emails" className="pt-6 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-headline font-bold text-white uppercase tracking-widest">Discovered Identities</h4>
                    <Badge variant="outline" className="text-accent border-accent/20">Verified Results</Badge>
                  </div>
                  
                  {emailsLoading ? (
                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
                  ) : (
                    <div className="space-y-3">
                      {extractedEmails?.map((email, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl group hover:border-primary/30 transition-all">
                          <div className="flex items-center space-x-3">
                            <Mail className={`h-4 w-4 ${email.isValid ? 'text-accent' : 'text-destructive'}`} />
                            <span className="text-sm font-medium text-white italic">{email.emailAddress}</span>
                          </div>
                          <Badge variant="secondary" className={email.isValid ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}>
                            {email.validationStatus}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="pages" className="pt-6 space-y-3">
                   {selectedDomain?.pageUrls?.map((page: string, i: number) => (
                    <div key={i} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/5 text-xs font-code">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">{page}</span>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="meta" className="pt-6">
                  <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/5">
                    <pre className="text-[10px] text-accent font-code whitespace-pre-wrap">
                      {selectedDomain?.metadata ? JSON.stringify(JSON.parse(selectedDomain.metadata), null, 2) : 'No metadata available'}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  )
}
