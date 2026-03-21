"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Download, Calendar, Filter, FileSpreadsheet, CheckCircle, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)
    setTimeout(() => {
      setIsExporting(false)
      alert("CSV Export Generated and Downloaded Successfully!")
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
            <Card className="lg:col-span-1 bg-card border-white/5 h-fit sticky top-8">
              <CardHeader>
                <CardTitle className="font-headline">Export Filters</CardTitle>
                <CardDescription>Refine the dataset for export.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Campaign Target</Label>
                  <Select>
                    <SelectTrigger className="bg-secondary/30 border-white/10">
                      <SelectValue placeholder="All Campaigns" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Campaigns</SelectItem>
                      <SelectItem value="saas">SaaS Competitors</SelectItem>
                      <SelectItem value="miami">Miami Leads</SelectItem>
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
                  <Label>Date Range (To)</Label>
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
                      <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  className="w-full bg-primary hover:bg-primary/90 glow-primary h-12"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? "Processing..." : (
                    <>
                      <Download className="h-4 w-4 mr-2" /> Generate Export
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 bg-card border-white/5">
              <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-white/5">
                <div>
                  <CardTitle className="font-headline">Data Preview</CardTitle>
                  <CardDescription>A snippet of the dataset matching your filters.</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-headline font-bold text-white">4,231</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Rows to be exported</p>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="font-headline">Domain</TableHead>
                      <TableHead className="font-headline">Primary Emails</TableHead>
                      <TableHead className="font-headline">Region</TableHead>
                      <TableHead className="font-headline">Category</TableHead>
                      <TableHead className="font-headline">Campaign</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { d: 'google.com', e: 'admin@google.com', r: 'US', c: 'Tech', camp: 'Tech Giants' },
                      { d: 'stripe.com', e: 'hello@stripe.com', r: 'US', c: 'Finance', camp: 'Fintech' },
                      { d: 'vercel.com', e: 'team@vercel.com', r: 'US', c: 'Tech', camp: 'SaaS' },
                      { d: 'amazon.co.uk', e: 'support@amazon.co.uk', r: 'UK', c: 'Retail', camp: 'E-commerce' },
                      { d: 'notion.so', e: 'press@notion.so', r: 'US', c: 'SaaS', camp: 'Productivity' },
                    ].map((row, i) => (
                      <TableRow key={i} className="border-white/5 text-xs">
                        <TableCell className="font-bold text-white">{row.d}</TableCell>
                        <TableCell className="text-muted-foreground">{row.e}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{row.r}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{row.c}</TableCell>
                        <TableCell className="text-muted-foreground">{row.camp}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="p-12 text-center text-muted-foreground text-sm italic border-t border-white/5">
                  ... and 4,226 more rows
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}