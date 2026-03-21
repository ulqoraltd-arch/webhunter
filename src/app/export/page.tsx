
"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Download, Calendar, Filter, FileSpreadsheet, CheckCircle, Search, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection } from "firebase/firestore"
import { useToast } from "@/hooks/use-toast"

export default function ExportPage() {
  const { toast } = useToast()
  const { user } = useUser()
  const db = useFirestore()
  const [isExporting, setIsExporting] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState("all")

  // Fetch real campaigns
  const campaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return collection(db, "admins", user.uid, "campaigns")
  }, [db, user])

  const { data: campaigns, isLoading } = useCollection(campaignsQuery)

  const handleExport = () => {
    setIsExporting(true)
    
    // Simulate real aggregation and CSV build
    setTimeout(() => {
      const target = selectedCampaign === 'all' ? 'All_Campaigns' : campaigns?.find(c => c.id === selectedCampaign)?.name
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Domain,Emails,Status,Campaign,Date\n"
        + `example-scraped.com,3,Success,${target},${new Date().toLocaleDateString()}`
      
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `webhunter_export_${target?.replace(/\s/g, '_')}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      setIsExporting(false)
      toast({ title: "Export Generated", description: "Your CSV dataset is ready." })
    }, 2000)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-headline font-bold text-white mb-1">Export Center</h1>
              <p className="text-muted-foreground">Compile and download your extracted datasets.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <Card className="lg:col-span-1 bg-card border-white/5 h-fit sticky top-8 shadow-2xl">
              <CardHeader>
                <CardTitle className="font-headline">Export Filters</CardTitle>
                <CardDescription>Refine the dataset for compilation.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Campaign Target</Label>
                  <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                    <SelectTrigger className="bg-secondary/30 border-white/10">
                      <SelectValue placeholder="All Campaigns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Campaigns</SelectItem>
                      {campaigns?.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range (From)</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="date" className="bg-secondary/30 border-white/10 pl-10" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select defaultValue="csv">
                    <SelectTrigger className="bg-secondary/30 border-white/10">
                      <SelectValue placeholder="Select Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (Standard)</SelectItem>
                      <SelectItem value="json">JSON (Developer)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-primary/90 glow-primary h-12 font-bold"
                  onClick={handleExport}
                  disabled={isExporting || isLoading}
                >
                  {isExporting ? <Loader2 className="animate-spin h-5 w-5" /> : (
                    <>
                      <Download className="h-4 w-4 mr-2" /> Generate Export
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 bg-card border-white/5 shadow-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/5">
                <div>
                  <CardTitle className="font-headline">Data Preview</CardTitle>
                  <CardDescription>A snippet of the dataset matching your selection.</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="font-headline">Domain</TableHead>
                      <TableHead className="font-headline">Yield</TableHead>
                      <TableHead className="font-headline">Campaign</TableHead>
                      <TableHead className="font-headline">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Real preview logic would go here, fetching from domains */}
                    <TableRow className="border-white/5 text-xs">
                      <TableCell className="font-bold text-white italic">Select a campaign to preview data...</TableCell>
                      <TableCell colSpan={3}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="p-12 text-center text-muted-foreground text-sm italic border-t border-white/5">
                  Live data compilation engine ready.
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
