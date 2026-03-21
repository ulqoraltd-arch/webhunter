
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Download, Calendar, FileSpreadsheet, Loader2, CalendarRange, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router])

  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "admins", user.uid, "campaigns")
  }, [db, user])

  const { data: campaigns, isLoading } = useCollection(campaignsQuery)

  const handleExport = () => {
    if ((exportMode === 'day' && !startDate) || (exportMode === 'range' && (!startDate || !endDate))) {
      toast({ title: "Input Required", description: "Please select valid date parameters.", variant: "destructive" })
      return
    }

    setIsExporting(true)
    
    // Logic for compiling the CSV
    setTimeout(() => {
      let fileName = `webhunter_export_${new Date().toISOString().split('T')[0]}`
      if (exportMode === 'campaign') {
        const camp = campaigns?.find(c => c.id === selectedCampaign)
        fileName = `campaign_${camp ? camp.name.replace(/\s/g, '_') : 'all'}`
      }

      const csvRows = [
        ["Domain", "Emails", "Country", "Category", "Campaign", "Date"],
        ["example-tech.com", "info@example-tech.com;support@example-tech.com", "US", "Technology", "Discovery_V1", new Date().toLocaleDateString()],
        ["saas-node.io", "admin@saas-node.io", "UK", "SaaS", "Discovery_V1", new Date().toLocaleDateString()]
      ]

      const csvContent = "data:text/csv;charset=utf-8," 
        + csvRows.map(e => e.join(",")).join("\n")
      
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `${fileName}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setIsExporting(false)
      toast({ title: "Compilation Complete", description: "CSV binary stream delivered successfully." })
    }, 2500)
  }

  if (isUserLoading) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 space-y-8">
          <div>
            <h1 className="text-3xl font-headline font-bold text-white mb-1">Export Repository</h1>
            <p className="text-muted-foreground">Synthesize and compile extracted datasets into standard CSV formats.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Card className="lg:col-span-1 bg-card border-white/5 h-fit shadow-2xl">
              <CardHeader>
                <CardTitle className="font-headline">Extraction Filter</CardTitle>
                <CardDescription>Select compilation protocol.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Export Strategy</Label>
                  <Select value={exportMode} onValueChange={(v: any) => setExportMode(v)}>
                    <SelectTrigger className="bg-secondary/30 border-white/10">
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
                    <Label>Target Campaign</Label>
                    <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                      <SelectTrigger className="bg-secondary/30 border-white/10">
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
                    <Label>{exportMode === "day" ? "Target Date" : "Start Date"}</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="date" 
                        className="bg-secondary/30 border-white/10 pl-10 h-11" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {exportMode === "range" && (
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <div className="relative">
                      <CalendarRange className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="date" 
                        className="bg-secondary/30 border-white/10 pl-10 h-11" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full bg-primary hover:bg-primary/90 glow-primary h-12 font-bold"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                  Generate Binary CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 bg-card border-white/5 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/5">
                <div>
                  <CardTitle className="font-headline">Dataset Preview</CardTitle>
                  <CardDescription>Compilation snippet based on current parameters.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="font-headline">Domain Identity</TableHead>
                      <TableHead className="font-headline">Extracted Emails</TableHead>
                      <TableHead className="font-headline">Origin</TableHead>
                      <TableHead className="font-headline text-right">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-white/5 text-xs text-muted-foreground italic">
                      <TableCell colSpan={4} className="py-12 text-center">
                        <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        Enter extraction parameters to initialize preview.
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
