
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Sparkles, Plus, Globe, Tag, Flag, Search, Calendar as CalendarIcon, Zap, Target, Activity, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { suggestKeywordsForCampaign } from "@/ai/flows/ai-keyword-suggestion"
import { useToast } from "@/hooks/use-toast"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FuturisticLoader } from "@/components/ui/futuristic-loader"
import { COUNTRIES, TLDS, CATEGORIES } from "@/app/lib/constants"
import { useFirestore, useUser } from "@/firebase"
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore"

export default function NewCampaignPage() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const { user } = useUser()
  
  const [campaignName, setCampaignName] = useState("")
  const [query, setQuery] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<{shortTailKeywords: string[], longTailKeywords: string[]} | null>(null)

  const [selectedTlds, setSelectedTlds] = useState<string[]>([".com"])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["SaaS", "Technology"])
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["US"])
  const [targetQuota, setTargetQuota] = useState(2000)

  const [tldSearch, setTldSearch] = useState("")
  const [categorySearch, setCategorySearch] = useState("")
  const [countrySearch, setCountrySearch] = useState("")

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      if (!keywords.includes(query.trim())) {
        setKeywords([...keywords, query.trim()])
      }
      setQuery("")
    }
  }

  const handleAiSuggest = async () => {
    if (!query.trim() && keywords.length === 0) {
      toast({ title: "Query required", description: "Enter a base keyword for AI analysis.", variant: "destructive" })
      return
    }
    setIsSuggesting(true)
    try {
      const result = await suggestKeywordsForCampaign({ query: query || keywords[0] })
      setAiSuggestions(result)
    } catch (err) {
      toast({ title: "AI Failed", description: "Neural network timeout. Try again.", variant: "destructive" })
    } finally {
      setIsSuggesting(false)
    }
  }

  const addSuggestion = (keyword: string) => {
    if (!keywords.includes(keyword)) setKeywords([...keywords, keyword])
  }

  const handleDeploy = async () => {
    if (!user) {
      toast({ title: "Auth Error", description: "Session expired. Please re-login.", variant: "destructive" })
      return
    }
    if (!campaignName || keywords.length === 0) {
      toast({ title: "Config Error", description: "Identity and Search Cluster required.", variant: "destructive" })
      return
    }

    setIsDeploying(true)
    
    try {
      const campaignId = `camp-${Date.now()}`
      const runId = `run-${Date.now()}`

      // 1. Create Campaign Document
      const campaignRef = doc(db, "admins", user.uid, "campaigns", campaignId)
      await setDoc(campaignRef, {
        id: campaignId,
        adminUserId: user.uid,
        name: campaignName,
        keywords,
        tldIds: selectedTlds,
        categoryIds: selectedCategories,
        countryIds: selectedCountries,
        targetEmailCount: targetQuota,
        status: "Running",
        totalDomainsFetched: 0,
        totalEmailsExtracted: 0,
        validEmailsCount: 0,
        flaggedEmailsCount: 0,
        lastRunId: runId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // 2. Create Initial Run Document
      const runRef = doc(db, "admins", user.uid, "campaigns", campaignId, "runs", runId)
      await setDoc(runRef, {
        id: runId,
        campaignId,
        adminUserId: user.uid,
        status: "Running",
        startTime: serverTimestamp(),
        progressTotalUrlsToProcess: targetQuota * 10, // Estimate 10:1 ratio
        progressUrlsProcessed: 0,
        progressUrlsRemaining: targetQuota * 10,
        progressDomainsWithEmails: 0,
        totalEmailsExtracted: 0,
        validEmailsExtracted: 0,
        flaggedEmailsExtracted: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      toast({ title: "Engine Deployed", description: "Extraction clusters are initializing." })
      
      setTimeout(() => {
        router.push(`/campaigns/progress?camp=${campaignId}&run=${runId}`)
      }, 2500)

    } catch (err) {
      setIsDeploying(false)
      toast({ title: "Deployment Failed", description: "Cluster rejected connection.", variant: "destructive" })
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <FuturisticLoader isVisible={isDeploying} status={`Establishing link for ${campaignName}...`} />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 max-w-6xl mx-auto w-full">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-headline font-bold text-white mb-2">Initialize Extraction</h1>
              <p className="text-muted-foreground text-lg">Configure your multi-node scraping engine with deep AI targeting.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="h-11 border-white/10 bg-white/5">Save Blueprint</Button>
              <Button 
                className="h-11 bg-primary hover:bg-primary/90 px-8 font-bold glow-primary"
                onClick={handleDeploy}
                disabled={isDeploying}
              >
                Launch Clusters
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-card border-white/5 shadow-2xl">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Campaign Descriptor</Label>
                    <Input 
                      placeholder="e.g. London Real Estate V2" 
                      className="bg-secondary/30 border-white/10 h-12"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5 shadow-2xl overflow-visible">
                <CardHeader>
                  <CardTitle className="flex items-center font-headline text-xl">
                    <Zap className="h-5 w-5 text-primary mr-3" />
                    Search Cluster
                  </CardTitle>
                  <CardDescription>Targeting logic for domain discovery.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Keywords</Label>
                    <div className="relative">
                      <Input 
                        placeholder="Enter seed keyword..." 
                        className="bg-secondary/30 border-white/10 pr-14 h-14 text-lg focus:ring-primary focus:border-primary/50 transition-all"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleAddKeyword}
                      />
                      <Popover open={!!aiSuggestions}>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-primary/20 text-accent h-10 w-10"
                            disabled={isSuggesting}
                            onClick={handleAiSuggest}
                          >
                            <Sparkles className={`h-6 w-6 ${isSuggesting ? 'animate-spin' : ''}`} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px] p-0 shadow-2xl border-white/10 bg-card/95 backdrop-blur-xl" align="end">
                          <div className="p-5 border-b border-white/5 bg-primary/5">
                            <h4 className="font-headline font-bold flex items-center text-lg">AI Keyword Suggestions</h4>
                          </div>
                          <ScrollArea className="h-[350px]">
                            <div className="p-6 space-y-6">
                              {aiSuggestions && (
                                <>
                                  <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-3">Short Tail</p>
                                    <div className="flex flex-wrap gap-2">
                                      {aiSuggestions.shortTailKeywords.map(k => (
                                        <Badge key={k} variant="secondary" className="cursor-pointer hover:bg-primary" onClick={() => addSuggestion(k)}>+ {k}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-3">Long Tail</p>
                                    <div className="flex flex-wrap gap-2">
                                      {aiSuggestions.longTailKeywords.map(k => (
                                        <Badge key={k} variant="outline" className="cursor-pointer hover:border-accent" onClick={() => addSuggestion(k)}>+ {k}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </ScrollArea>
                          <div className="p-4 text-center border-t border-white/5 bg-white/5">
                            <Button variant="ghost" size="sm" onClick={() => setAiSuggestions(null)}>Dismiss</Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-wrap gap-2.5 min-h-[48px] p-3 bg-secondary/10 rounded-xl border border-dashed border-white/5">
                      {keywords.map((k, i) => (
                        <Badge key={i} className="bg-primary/20 text-primary border-primary/30 px-4 py-2 flex items-center">
                          {k}
                          <X className="ml-3 h-3.5 w-3.5 cursor-pointer" onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))} />
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5 shadow-2xl">
                <CardHeader>
                  <CardTitle className="font-headline text-xl flex items-center">
                    <Target className="h-5 w-5 text-primary mr-3" />
                    Extraction Strategy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Email Quota</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          value={targetQuota} 
                          onChange={(e) => setTargetQuota(Number(e.target.value))}
                          className="bg-secondary/30 border-white/10 h-14 text-xl font-bold pl-4" 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold">VALIDS</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Execution Mode</Label>
                      <Tabs defaultValue="instant" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-12 bg-secondary/50">
                          <TabsTrigger value="instant" className="h-10">Instant</TabsTrigger>
                          <TabsTrigger value="schedule" className="h-10">Scheduled</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-headline flex items-center justify-between">
                    TLDs <Badge variant="secondary">{selectedTlds.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Filter TLDs..." className="h-10 bg-secondary/30" value={tldSearch} onChange={(e) => setTldSearch(e.target.value)} />
                  <ScrollArea className="h-[180px] pr-4">
                    <div className="space-y-2">
                      {TLDS.filter(t => t.includes(tldSearch)).map(tld => (
                        <div key={tld} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5">
                          <Checkbox checked={selectedTlds.includes(tld)} onCheckedChange={() => setSelectedTlds(prev => prev.includes(tld) ? prev.filter(t => t !== tld) : [...prev, tld])} />
                          <span className="text-sm">{tld}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-headline flex items-center justify-between">
                    Categories <Badge variant="secondary">{selectedCategories.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Filter Categories..." className="h-10 bg-secondary/30" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
                  <ScrollArea className="h-[180px] pr-4">
                    <div className="space-y-2">
                      {CATEGORIES.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => (
                        <div key={cat} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5">
                          <Checkbox checked={selectedCategories.includes(cat)} onCheckedChange={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])} />
                          <span className="text-sm">{cat}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-headline flex items-center justify-between">
                    Regions <Badge variant="secondary">{selectedCountries.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input placeholder="Filter Regions..." className="h-10 bg-secondary/30" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} />
                  <ScrollArea className="h-[180px] pr-4">
                    <div className="space-y-2">
                      {COUNTRIES.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map(country => (
                        <div key={country.iso} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5">
                          <Checkbox checked={selectedCountries.includes(country.iso)} onCheckedChange={() => setSelectedCountries(prev => prev.includes(country.iso) ? prev.filter(c => c !== country.iso) : [...prev, country.iso])} />
                          <span className="text-sm">{country.name} ({country.iso})</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
