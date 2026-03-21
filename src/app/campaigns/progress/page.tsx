"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Activity, Globe, Mail, Clock, RefreshCw, StopCircle, CheckCircle2, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function CampaignProgressPage() {
  const [progress, setProgress] = useState(65)
  const [processed, setProcessed] = useState(8500)
  const [total, setTotal] = useState(25000)
  const [validDomains, setValidDomains] = useState(2100)
  const [emailsFound, setEmailsFound] = useState(5420)

  // Simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setProcessed(prev => Math.min(prev + Math.floor(Math.random() * 50), total))
      setValidDomains(prev => prev + (Math.random() > 0.8 ? 1 : 0))
      setEmailsFound(prev => prev + Math.floor(Math.random() * 3))
    }, 2000)
    return () => clearInterval(timer)
  }, [total])

  const progressPercent = Math.floor((processed / total) * 100)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-accent/20 rounded-2xl">
                <Activity className="h-8 w-8 text-accent animate-pulse" />
              </div>
              <div>
                <h1 className="text-3xl font-headline font-bold text-white mb-1">Miami Leads - Expansion</h1>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-accent text-accent-foreground font-bold px-3">ACTIVE</Badge>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Clock className="h-3 w-3 mr-1" /> Started: 24 mins ago
                  </span>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="border-white/10 hover:bg-white/5">
                <RefreshCw className="h-4 w-4 mr-2" /> Pause
              </Button>
              <Button variant="destructive">
                <StopCircle className="h-4 w-4 mr-2" /> Abort
              </Button>
            </div>
          </div>

          <Card className="bg-card border-white/5 overflow-hidden shadow-2xl">
            <div className="h-2 w-full bg-white/5 relative overflow-hidden">
               <div 
                 className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-in-out" 
                 style={{ width: `${progressPercent}%` }}
               >
                 <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-bar-stripes_1s_linear_infinite]" />
               </div>
            </div>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global Progress</p>
                <h2 className="text-4xl font-headline font-bold text-white">{progressPercent}%</h2>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">URLs Processed</p>
                <div className="flex items-baseline space-x-2">
                  <h2 className="text-3xl font-headline font-bold text-white">{processed.toLocaleString()}</h2>
                  <span className="text-xs text-muted-foreground">/ {total.toLocaleString()}</span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Valid Domains</p>
                <div className="flex items-center space-x-2">
                  <h2 className="text-3xl font-headline font-bold text-accent">{validDomains.toLocaleString()}</h2>
                  <Globe className="h-5 w-5 text-accent" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Emails Extracted</p>
                <div className="flex items-center space-x-2">
                  <h2 className="text-3xl font-headline font-bold text-primary">{emailsFound.toLocaleString()}</h2>
                  <Mail className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2 text-primary animate-spin" />
                  Currently Scanning
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  'https://luxuryresortmiami.com/contact',
                  'https://beachside-realestate.net/about',
                  'https://miami-tech-solutions.io/team',
                  'https://oceanview-apartments.com/footer',
                  'https://south-beach-villas.net/en/contact-us'
                ].map((url, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 text-xs font-code">
                    <span className="text-muted-foreground truncate max-w-sm">{url}</span>
                    <Badge variant="outline" className="text-[9px] border-primary/20 text-primary uppercase">Crawling</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-white/5">
              <CardHeader>
                <CardTitle className="text-lg font-headline flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-accent" />
                  Recently Verified Domains
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 {[
                  { domain: 'sunshinerealestate.com', emails: 4, country: 'US' },
                  { domain: 'floridabeach.io', emails: 2, country: 'US' },
                  { domain: 'miami-legal.net', emails: 1, country: 'US' },
                  { domain: 'condo-hunters.com', emails: 7, country: 'US' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-accent/10">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-bold text-white">{item.domain}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{item.country} • Business</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent font-bold">
                      {item.emails} Emails Found
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <style jsx global>{`
        @keyframes progress-bar-stripes {
          from { background-position: 20px 0; }
          to { background-position: 0 0; }
        }
      `}</style>
    </div>
  )
}