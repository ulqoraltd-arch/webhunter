"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Sparkles, Plus, Globe, Tag, Flag, Search, Calendar as CalendarIcon, Zap, Target, X, Loader2, Clock, Activity, ArrowRight } from "lucide-react"
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
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { doc, setDoc, serverTimestamp, collection, writeBatch, getDocs, query, where, limit } from "firebase/firestore"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { COUNTRIES, TLDS, CATEGORIES } from "@/app/lib/constants"
import axios from "axios"

export default function NewCampaignPage() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  
  const [campaignName, setCampaignName] = useState("")
  const [queryInput, setQueryInput] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<{shortTailKeywords: string[], longTailKeywords: string[]} | null>(null)

  const [selectedTlds, setSelectedTlds] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [targetQuota, setTargetQuota] = useState(2000)
  const [mode, setMode] = useState<"instant" | "scheduled">("instant")
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date())

  // Real-time metadata
  const tldsQuery = useMemoFirebase(() => collection(db, "tlds"), [db])
  const catsQuery = useMemoFirebase(() => collection(db, "categories"), [db])
  const countriesQuery = useMemoFirebase(() => collection(db, "countries"), [db])

  const { data: dbTlds } = useCollection(tldsQuery)
  const { data: dbCats } = useCollection(catsQuery)
  const { data: dbCountries } = useCollection(countriesQuery)

  const [tldSearch, setTldSearch] = useState("")
  const [categorySearch, setCategorySearch] = useState("")
  const [countrySearch, setCountrySearch] = useState("")

  const [newEntry, setNewEntry] = useState({ tld: "", category: "", countryName: "", countryIso: "" })

  // Check for active running campaign
  const activeCampQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "admins", user.uid, "campaigns"),
      where("status", "==", "Running"),
      limit(1)
    )
  }, [db, user])
  const { data: activeCamps } = useCollection(activeCampQuery)
  const activeCampaign = activeCamps?.[0]
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router])

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && queryInput.trim()) {
      if (!keywords.includes(queryInput.trim())) {
        setKeywords([...keywords, queryInput.trim()])
      }
      setQueryInput("")
    }
  }

  const handleAiSuggest = async () => {
    if (!queryInput.trim() && keywords.length === 0) {
      toast({ title: "Query required", description: "Enter at least one keyword.", variant: "destructive" })
      return
    }
    setIsSuggesting(true)
    try {
      const result = await suggestKeywordsForCampaign({ query: queryInput || keywords[0] })
      setAiSuggestions(result)
    } catch (err: any) {
      toast({ title: "AI Error", description: "Failed to fetch suggestions", variant: "destructive" })
    } finally {
      setIsSuggesting(false)
    }
  }

  const addSuggestion = (keyword: string) => {
    if (!keywords.includes(keyword)) setKeywords([...keywords, keyword])
  }

  const handleQuickAdd = async (type: 'tld' | 'category' | 'country') => {
    if (!user || !db) return
    if (type === 'tld' && newEntry.tld) {
      const clean = newEntry.tld.replace('.', '').toLowerCase()
      await setDoc(doc(db, "tlds", clean), { name: clean, createdAt: serverTimestamp(), adminUserId: user.uid })
      setNewEntry({ ...newEntry, tld: "" })
    } else if (type === 'category' && newEntry.category) {
      const customId = newEntry.category.toLowerCase().replace(/\s/g, '-')
      await setDoc(doc(db, "categories", customId), { name: newEntry.category, createdAt: serverTimestamp(), adminUserId: user.uid })
      setNewEntry({ ...newEntry, category: "" })
    } else if (type === 'country' && newEntry.countryName && newEntry.countryIso) {
      const customId = newEntry.countryIso.toUpperCase()
      await setDoc(doc(db, "countries", customId), { name: newEntry.countryName, isoCode: customId, createdAt: serverTimestamp(), adminUserId: user.uid })
      setNewEntry({ ...newEntry, countryName: "", countryIso: "" })
    }
    toast({ title: "Registry Updated", description: "Master list expanded." })
  }

  const handleDeploy = async () => {
    if (!user || !db) return
    
    // Validation
    const missing = []
    if (!campaignName.trim()) missing.push("Engine Descriptor")
    if (keywords.length === 0) missing.push("Search Keywords (Press Enter)")
    if (selectedTlds.length === 0) missing.push("TLDs")
    if (selectedCategories.length === 0) missing.push("Verticals")
    if (selectedCountries.length === 0) missing.push("Regions")
    if (mode === 'scheduled' && !scheduledDate) missing.push("Scheduled Time")

    if (missing.length > 0) {
      toast({ title: "Configuration Incomplete", description: `Address: ${missing.join(", ")}`, variant: "destructive" })
      return
    }

    setIsDeploying(true)
    
    try {
      const campaignId = `camp-${Date.now()}`
      const runId = `run-${Date.now()}`

      await setDoc(doc(db, "admins", user.uid, "campaigns", campaignId), {
        id: campaignId,
        adminUserId: user.uid,
        name: campaignName,
        keywords,
        tldIds: selectedTlds,
        categoryIds: selectedCategories,
        countryIds: selectedCountries,
        targetEmailCount: targetQuota,
        mode,
        scheduledDateTime: mode === 'scheduled' ? scheduledDate?.toISOString() : null,
        status: mode === 'instant' ? "Running" : "Scheduled",
        totalDomainsFetched: 0,
        totalEmailsExtracted: 0,
        validEmailsCount: 0,
        flaggedEmailsCount: 0,
        lastRunId: mode === 'instant' ? runId : null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      if (mode === 'instant') {
        await setDoc(doc(db, "admins", user.uid, "campaigns", campaignId, "runs", runId), {
          id: runId,
          campaignId,
          adminUserId: user.uid,
          status: "Running",
          startTime: serverTimestamp(),
          progressTotalUrlsToProcess: targetQuota * 5,
          progressUrlsProcessed: 0,
          progressUrlsRemaining: targetQuota * 5,
          progressDomainsWithEmails: 0,
          totalEmailsExtracted: 0,
          validEmailsExtracted: 0,
          flaggedEmailsExtracted: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        // Queue in BullMQ via API
        await axios.post('/api/campaigns/start', {
          campaignId,
          adminId: user.uid,
          runId,
          keywords,
          quota: targetQuota
        })

        toast({ title: "Deployment Successful", description: "Engine is online. Redirecting to feed..." })
        setTimeout(() => router.push(`/campaigns/progress?camp=${campaignId}&run=${runId}`), 1500)
      } else {
        toast({ title: "Campaign Scheduled", description: "Cluster queued for future activation." })
        setTimeout(() => router.push('/campaigns'), 1500)
      }
    } catch (err: any) {
      console.error(err)
      setIsDeploying(false)
      toast({ title: "Deployment Failed", description: err.message, variant: "destructive" })
    }
  }

  if (isUserLoading) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <FuturisticLoader isVisible={isDeploying} status={`INITIALIZING CLUSTER: ${campaignName}...`} />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-headline font-bold text-white mb-2 tracking-tighter">Engine Deployment</h1>
              <p className="text-muted-foreground text-lg">Configure targeted parameters for your multi-node extraction cluster.</p>
            </div>
            
            {activeCampaign ? (
              <Button 
                variant="outline"
                className="h-14 border-accent text-accent hover:bg-accent/10 px-10 font-black tracking-widest uppercase shadow-[0_0_20px_rgba(90,212,255,0.2)]"
                onClick={() => router.push(`/campaigns/progress?camp=${activeCampaign.id}&run=${activeCampaign.lastRunId}`)}
              >
                <Activity className="mr-3 h-5 w-5 animate-pulse" />
                View Live Progress
              </Button>
            ) : (
              <Button 
                className="h-14 bg-primary hover:bg-primary/90 px-10 font-black tracking-widest uppercase shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
                onClick={handleDeploy}
                disabled={isDeploying}
              >
                Launch Engine <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="bg-card border-white/5 shadow-2xl">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Identity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cluster Descriptor</Label>
                    <Input 
                      placeholder="e.g. Real Estate London Cluster" 
                      className="bg-secondary/30 border-white/10 h-14 text-lg"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5 shadow-2xl overflow-visible">
                <CardHeader>
                  <CardTitle className="flex items-center font-headline text-xl">
                    <Zap className="h-5 w-5 text-primary mr-3" /> Target Acquisition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Search Keywords</Label>
                    <div className="relative">
                      <Input 
                        placeholder="Enter keyword and press ENTER..." 
                        className="bg-secondary/30 border-white/10 pr-14 h-14 text-lg"
                        value={queryInput}
                        onChange={(e) => setQueryInput(e.target.value)}
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
                            {isSuggesting ? <Loader2 className="animate-spin h-5 w-5" /> : <Sparkles className="h-6 w-6" />}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px] p-0 shadow-2xl border-white/10 bg-card/95 backdrop-blur-xl" align="end">
                          <div className="p-5 border-b border-white/5 bg-primary/5 flex items-center justify-between">
                            <h4 className="font-headline font-bold text-lg">Neural Suggestions</h4>
                            <Button variant="ghost" size="icon" onClick={() => setAiSuggestions(null)}><X className="h-4 w-4" /></Button>
                          </div>
                          <ScrollArea className="h-[350px]">
                            <div className="p-6 space-y-6">
                              {aiSuggestions && (
                                <>
                                  <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-3">Broad</p>
                                    <div className="flex flex-wrap gap-2">
                                      {aiSuggestions.shortTailKeywords.map(k => (
                                        <Badge key={k} variant="secondary" className="cursor-pointer hover:bg-primary" onClick={() => addSuggestion(k)}>+ {k}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-3">Niche</p>
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
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-wrap gap-2.5 min-h-[56px] p-3 bg-secondary/10 rounded-xl border border-dashed border-white/10">
                      {keywords.map((k, i) => (
                        <Badge key={i} className="bg-primary/20 text-primary border-primary/30 px-4 py-2 flex items-center group">
                          {k}
                          <X className="ml-3 h-3.5 w-3.5 cursor-pointer opacity-50 group-hover:opacity-100" onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))} />
                        </Badge>
                      ))}
                      {keywords.length === 0 && <p className="text-xs text-muted-foreground italic p-2">Add keywords to initialize discovery cluster...</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5 shadow-2xl">
                <CardHeader>
                  <CardTitle className="font-headline text-xl flex items-center">
                    <Target className="h-5 w-5 text-primary mr-3" /> Execution Protocol
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Extraction Quota</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          value={targetQuota} 
                          onChange={(e) => setTargetQuota(Number(e.target.value))}
                          className="bg-secondary/30 border-white/10 h-14 text-xl font-bold pl-4" 
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">Identities</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Deployment Mode</Label>
                      <Tabs value={mode} onValueChange={(v: any) => setMode(v)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 h-14 bg-secondary/50">
                          <TabsTrigger value="instant" className="h-10">Instant</TabsTrigger>
                          <TabsTrigger value="scheduled" className="h-10">Scheduled</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>

                  {mode === 'scheduled' && (
                    <div className="p-6 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-top-4">
                      <div className="flex items-center space-x-4">
                        <CalendarIcon className="h-10 w-10 text-primary" />
                        <div className="flex-1">
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Target Launch Point</p>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full h-12 justify-start text-left font-normal bg-secondary/30 border-white/10">
                                <Clock className="mr-2 h-4 w-4" />
                                {scheduledDate ? format(scheduledDate, "PPP 'at' HH:mm") : "Select execution point..."}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={scheduledDate}
                                onSelect={setScheduledDate}
                                initialFocus
                              />
                              <div className="p-4 border-t border-white/5 bg-card">
                                <Input 
                                  type="time" 
                                  className="h-10 bg-secondary/30 border-white/10" 
                                  onChange={(e) => {
                                    if (scheduledDate) {
                                      const [hours, minutes] = e.target.value.split(':')
                                      const newDate = new Date(scheduledDate)
                                      newDate.setHours(parseInt(hours), parseInt(minutes))
                                      setScheduledDate(newDate)
                                    }
                                  }}
                                />
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
              {/* TLDs */}
              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-headline tracking-widest uppercase">TLDs</CardTitle>
                  <Checkbox 
                    id="tld-all"
                    checked={dbTlds && selectedTlds.length === dbTlds.length}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedTlds(dbTlds?.map(t => t.name) || [])
                      else setSelectedTlds([])
                    }} 
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search..." className="h-9 pl-9 bg-secondary/30 border-white/5" value={tldSearch} onChange={(e) => setTldSearch(e.target.value)} />
                  </div>
                  <ScrollArea className="h-[180px] pr-4">
                    <div className="space-y-1">
                      {dbTlds?.filter(t => t.name.includes(tldSearch)).map(tld => (
                        <div key={tld.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5">
                          <Checkbox 
                            id={`tld-${tld.id}`}
                            checked={selectedTlds.includes(tld.name)}
                            onCheckedChange={() => setSelectedTlds(p => p.includes(tld.name) ? p.filter(x => x !== tld.name) : [...p, tld.name])} 
                          />
                          <label htmlFor={`tld-${tld.id}`} className="text-xs text-muted-foreground cursor-pointer font-code">{tld.name}</label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Categories */}
              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-headline tracking-widest uppercase">Verticals</CardTitle>
                  <Checkbox 
                    id="cat-all"
                    checked={dbCats && selectedCategories.length === dbCats.length}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedCategories(dbCats?.map(c => c.name) || [])
                      else setSelectedCategories([])
                    }} 
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search..." className="h-9 pl-9 bg-secondary/30 border-white/5" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
                  </div>
                  <ScrollArea className="h-[180px] pr-4">
                    <div className="space-y-1">
                      {dbCats?.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => (
                        <div key={cat.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5">
                          <Checkbox 
                            id={`cat-${cat.id}`}
                            checked={selectedCategories.includes(cat.name)} 
                            onCheckedChange={() => setSelectedCategories(p => p.includes(cat.name) ? p.filter(x => x !== cat.name) : [...p, cat.name])} 
                          />
                          <label htmlFor={`cat-${cat.id}`} className="text-xs text-muted-foreground cursor-pointer">{cat.name}</label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Regions */}
              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-headline tracking-widest uppercase">Regions</CardTitle>
                  <Checkbox 
                    id="region-all"
                    checked={dbCountries && selectedCountries.length === dbCountries.length}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedCountries(dbCountries?.map(c => c.isoCode) || [])
                      else setSelectedCountries([])
                    }} 
                  />
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search..." className="h-9 pl-9 bg-secondary/30 border-white/5" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} />
                  </div>
                  <ScrollArea className="h-[180px] pr-4">
                    <div className="space-y-1">
                      {dbCountries?.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map(country => (
                        <div key={country.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5">
                          <Checkbox 
                            id={`country-${country.id}`}
                            checked={selectedCountries.includes(country.isoCode)} 
                            onCheckedChange={() => setSelectedCountries(p => p.includes(country.isoCode) ? p.filter(x => x !== country.isoCode) : [...p, country.isoCode])} 
                          />
                          <label htmlFor={`country-${country.id}`} className="text-xs text-muted-foreground cursor-pointer flex items-center">
                            <span className="w-6 h-4 bg-white/5 rounded border border-white/5 text-[8px] flex items-center justify-center mr-2 font-bold">{country.isoCode}</span>
                            {country.name}
                          </label>
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
