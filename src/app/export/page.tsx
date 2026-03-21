
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Download, Calendar, FileSpreadsheet, Loader2, CalendarRange, Trash2, Database, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, getDocs, query, where, orderBy } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"
import { format, startOfDay, endOfDay, parseISO, isWithinInterval } from "date-fns"

export default function ExportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user, isUserLoading } = useUser()
  const db = useFirestore()
  
  const [isExporting, setIsExporting] = useState(false)
  const [exportMode, setExportMode] = useState<"campaign" | "day" | "range">("campaign")
  const [selectedCampaign, setSelectedCampaign] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [previewData, setPreviewData] = useState<any[]>([])

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router])

  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "admins", user.uid, "campaigns")
  }, [db, user])

  const { data: campaigns } = useCollection(campaignsQuery)

  const handleExport = async () => {
    if ((exportMode === 'day' && !startDate) || (exportMode === 'range' && (!startDate || !endDate))) {
      toast({ title: "Input Required", description: "Please select valid date parameters.", variant: "destructive" })
      return
    }

    setIsExporting(true)
    
    try {
      let allExportRows: any[] = []
      
      // We need to fetch domains across campaigns
      // For this SaaS prototype, we iterate through campaigns to gather data
      if (campaigns) {
        for (const camp of campaigns) {
          if (exportMode === 'campaign' && selectedCampaign !== 'all' && camp.id !== selectedCampaign) continue

          const domainsRef = collection(db, "admins", user?.uid!, "campaigns", camp.id, "runs", camp.lastRunId || "active", "domains")
          const domainsSnap = await getDocs(domainsRef)
          
          for (const domainDoc of domainsSnap.docs) {
            const domainData = domainDoc.data()
            const createdDate = domainData.createdAt?.toDate() || new Date()

            // Filter by date if needed
            if (exportMode === 'day') {
              const target = startOfDay(parseISO(startDate))
              if (startOfDay(createdDate).getTime() !== target.getTime()) continue
            } else if (exportMode === 'range') {
              const start = startOfDay(parseISO(startDate))
              const end = endOfDay(parseISO(endDate))
              if (!isWithinInterval(createdDate, { start, end })) continue
            }

            // Fetch emails for this domain
            const emailsRef = collection(db, "admins", user?.uid!, "campaigns", camp.id, "runs", camp.lastRunId || "active", "domains", domainDoc.id, "emails")
            const emailsSnap = await getDocs(emailsRef)
            const emails = emailsSnap.docs.map(d => d.data().emailAddress).join('; ')

            allExportRows.push({
              domain: domainData.domainName,
              emails,
              campaign: camp.name,
              status: domainData.status,
              date: format(createdDate, 'yyyy-MM-dd HH:mm:ss')
            })
          }
        }
      }

      if (allExportRows.length === 0) {
        toast({ title: "No Data Found", description: "Zero results matched your current filters.", variant: "destructive" })
        setIsExporting(false)
        return
      }

      // Generate CSV
      const headers = ["Domain", "Extracted Emails", "Source Campaign", "Status", "Timestamp"]
      const csvContent = [
        headers.join(","),
        ...allExportRows.map(row => [
          row.domain,
          `"${row.emails}"`,
          `"${row.campaign}"`,
          row.status,
          row.date
        ].join(","))
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      const fileName = `webhunter_export_${exportMode}_${format(new Date(), 'yyyyMMdd')}.csv`
      
      link.setAttribute("href", url)
      link.setAttribute("download", fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setIsExporting(false)
      toast({ title: "Export Successful", description: `${allExportRows.length} identities synthesized into CSV.` })
    } catch (err) {
      console.error(err)
      setIsExporting(false)
      toast({ title: "Export Failed", description: "An error occurred during binary stream compilation.", variant: "destructive" })
    }
  }

  if (isUserLoading) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-headline font-bold text-white mb-2 tracking-tighter uppercase italic">Export Repository</h1>
              <p className="text-muted-foreground text-lg">Synthesize and compile extracted datasets into standard CSV binary streams.</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
              <Database className="h-8 w-8 text-primary animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Card className="lg:col-span-1 bg-card border-white/5 h-fit shadow-2xl overflow-hidden">
              <div className="h-1 w-full bg-gradient-to-r from-primary to-accent" />
              <CardHeader>
                <CardTitle className="font-headline text-xl">Extraction Filter</CardTitle>
                <CardDescription>Select compilation protocol.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Export Strategy</Label>
                  <Select value={exportMode} onValueChange={(v: any) => setExportMode(v)}>
                    <SelectTrigger className="bg-secondary/30 border-white/10 h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campaign">By Campaign</SelectItem>
                      <SelectItem value="day">Single Day</SelectItem>
                      <SelectItem value="range">Custom Date Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {exportMode === "campaign" && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Cluster</Label>
                    <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                      <SelectTrigger className="bg-secondary/30 border-white/10 h-12">
                        <SelectValue placeholder="All Campaigns" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Global Extraction</SelectItem>
                        {campaigns?.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(exportMode === "day" || exportMode === "range") && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      {exportMode === "day" ? "Target Day" : "Start Interval"}
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="date" 
                        className="bg-secondary/30 border-white/10 pl-10 h-12" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {exportMode === "range" && (
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">End Interval</Label>
                    <div className="relative">
                      <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="date" 
                        className="bg-secondary/30 border-white/10 pl-10 h-12" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full bg-primary hover:bg-primary/90 glow-primary h-14 font-black tracking-[0.2em] uppercase text-xs"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Download className="h-4 w-4 mr-3" />}
                  Generate Binary CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 bg-card border-white/5 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/5 bg-white/[0.02]">
                <div>
                  <CardTitle className="font-headline text-xl">Engine Performance Snapshot</CardTitle>
                  <CardDescription>Compilation snippet based on current parameters.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="font-headline uppercase text-[10px] tracking-widest">Domain Identity</TableHead>
                      <TableHead className="font-headline uppercase text-[10px] tracking-widest">Identity Yield</TableHead>
                      <TableHead className="font-headline uppercase text-[10px] tracking-widest">Source Node</TableHead>
                      <TableHead className="font-headline uppercase text-[10px] tracking-widest text-right">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-white/5 text-xs text-muted-foreground italic">
                      <TableCell colSpan={4} className="py-24 text-center">
                        <div className="flex flex-col items-center">
                          <FileSpreadsheet className="h-16 w-16 mb-6 opacity-5 animate-pulse" />
                          <p className="text-lg font-headline font-bold text-white/40">INITIALIZE PARAMETERS</p>
                          <p className="text-sm mt-2">Select extraction filters to compile data stream preview.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
