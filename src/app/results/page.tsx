"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  ExternalLink, 
  Mail, 
  Globe, 
  CheckCircle,
  FileText
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const mockResults = [
  { domain: 'techcrunch.com', campaign: 'SaaS Leads', country: 'US', category: 'Technology', emails: 42, status: 'Active' },
  { domain: 'stripe.com', campaign: 'Fintech 2024', country: 'US', category: 'Finance', emails: 124, status: 'Active' },
  { domain: 'vercel.com', campaign: 'Developer Tools', country: 'US', category: 'Technology', emails: 56, status: 'Active' },
  { domain: 'digitalocean.com', campaign: 'SaaS Leads', country: 'US', category: 'Technology', emails: 89, status: 'Active' },
  { domain: 'notion.so', campaign: 'Productivity', country: 'US', category: 'SaaS', emails: 34, status: 'Active' },
  { domain: 'shopify.com', campaign: 'E-commerce', country: 'CA', category: 'E-commerce', emails: 245, status: 'Active' },
  { domain: 'canva.com', campaign: 'Design Tools', country: 'AU', category: 'Graphics', emails: 67, status: 'Active' },
]

export default function ResultsPage() {
  const [selectedDomain, setSelectedDomain] = useState<typeof mockResults[0] | null>(null)

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
                  <Input placeholder="Search domains, campaigns..." className="pl-9 bg-secondary/30 border-white/10" />
                </div>
                <Button variant="outline" size="sm" className="border-white/10">
                  <Filter className="h-4 w-4 mr-2" /> Filter
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing <span className="text-white font-bold">12,402</span> Results
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/5 hover:bg-transparent">
                    <TableHead className="w-[300px] font-headline">Domain</TableHead>
                    <TableHead className="font-headline">Campaign</TableHead>
                    <TableHead className="font-headline">Region</TableHead>
                    <TableHead className="font-headline">Category</TableHead>
                    <TableHead className="font-headline">Emails Found</TableHead>
                    <TableHead className="font-headline">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockResults.map((result) => (
                    <TableRow 
                      key={result.domain} 
                      className="border-white/5 cursor-pointer hover:bg-white/5 transition-colors group"
                      onClick={() => setSelectedDomain(result)}
                    >
                      <TableCell className="font-medium text-white flex items-center">
                         <Globe className="h-4 w-4 mr-3 text-muted-foreground group-hover:text-primary transition-colors" />
                         {result.domain}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{result.campaign}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tighter">
                          {result.country}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{result.category}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-primary/10 text-primary font-bold">
                          {result.emails}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <CheckCircle className="h-3 w-3 text-accent mr-1.5" />
                          <span className="text-xs font-medium">{result.status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      <Sheet open={!!selectedDomain} onOpenChange={() => setSelectedDomain(null)}>
        <SheetContent className="w-[600px] sm:max-w-xl bg-card border-l-white/10">
          <SheetHeader className="mb-8">
            <div className="flex items-center justify-between">
               <div className="p-3 bg-primary/10 rounded-xl mb-4">
                <Globe className="h-8 w-8 text-primary" />
              </div>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Download className="h-4 w-4 mr-2" /> Export CSV
              </Button>
            </div>
            <SheetTitle className="text-3xl font-headline font-bold text-white">{selectedDomain?.domain}</SheetTitle>
            <SheetDescription className="text-muted-foreground flex items-center">
              Campaign: <span className="text-white ml-2">{selectedDomain?.campaign}</span>
              <span className="mx-2 opacity-30">|</span>
              Region: <Badge variant="outline" className="ml-1 text-[10px]">{selectedDomain?.country}</Badge>
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="emails" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-secondary/50">
              <TabsTrigger value="emails">Emails ({selectedDomain?.emails})</TabsTrigger>
              <TabsTrigger value="pages">Pages Scanned</TabsTrigger>
              <TabsTrigger value="meta">Metadata</TabsTrigger>
            </TabsList>
            
            <TabsContent value="emails" className="pt-6 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-headline font-bold text-white uppercase tracking-widest">Discovered Identities</h4>
                <Badge variant="outline" className="text-accent border-accent/20">85% MX Validated</Badge>
              </div>
              {[
                'admin@' + (selectedDomain?.domain || 'domain.com'),
                'contact@' + (selectedDomain?.domain || 'domain.com'),
                'support@' + (selectedDomain?.domain || 'domain.com'),
                'hr@' + (selectedDomain?.domain || 'domain.com'),
                'sales@' + (selectedDomain?.domain || 'domain.com')
              ].map((email, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl group hover:border-primary/30 transition-all">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-white">{email}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="pages" className="pt-6 space-y-3">
               {[
                '/contact',
                '/about-us',
                '/team-members',
                '/terms-of-service',
                '/privacy-policy'
              ].map((page, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/5 text-xs font-code">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">{page}</span>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="meta" className="pt-6">
              <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Server Type</p>
                    <p className="text-sm font-medium text-white">Cloudflare / Nginx</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">SSL Status</p>
                    <p className="text-sm font-medium text-accent">Secured (LetsEncrypt)</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Discovery Engine</p>
                    <p className="text-sm font-medium text-white">Scraper API V3</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Time to Extract</p>
                    <p className="text-sm font-medium text-white">4.2s</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>
    </div>
  )
}