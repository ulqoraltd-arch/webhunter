"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Sparkles, Plus, Globe, Tag, Flag, Search, Calendar as CalendarIcon, Zap, Target, X, Loader2, Clock } from "lucide-react"
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
import { doc, setDoc, serverTimestamp, collection, writeBatch, getDocs } from "firebase/firestore"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { COUNTRIES, TLDS, CATEGORIES } from "@/app/lib/constants"

export default function NewCampaignPage() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const { user, isUserLoading } = useUser()
  
  const [campaignName, setCampaignName] = useState("")
  const [query, setQuery] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<{shortTailKeywords: string[], longTailKeywords: string[]} | null>(null)

  const [selectedTlds, setSelectedTlds] = useState<string[]>(["com"])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["SaaS"])
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["US"])
  const [targetQuota, setTargetQuota] = useState(2000)
  const [mode, setMode] = useState<"instant" | "scheduled">("instant")
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date())

  // Real-time metadata for selectors
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

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login')
    }
  }, [user, isUserLoading, router])

  // Seed the registry if Firestore is empty
  useEffect(() => {
    const seedRegistry = async () => {
      if (!db || !user) return
      
      const tldSnap = await getDocs(collection(db, "tlds"))
      if (tldSnap.empty) {
        const batch = writeBatch(db)
        TLDS.forEach(t => {
          const id = t.replace('.', '')
          batch.set(doc(db, "tlds", id), { name: t, createdAt: serverTimestamp() })
        })
        await batch.commit()
      }

      const catSnap = await getDocs(collection(db, "categories"))
      if (catSnap.empty) {
        const batch = writeBatch(db)
        CATEGORIES.forEach(c => {
          const id = c.toLowerCase().replace(/\s/g, '-')
          batch.set(doc(db, "categories", id), { name: c, createdAt: serverTimestamp() })
        })
        await batch.commit()
      }

      const countrySnap = await getDocs(collection(db, "countries"))
      if (countrySnap.empty) {
        const batch = writeBatch(db)
        COUNTRIES.forEach(c => {
          batch.set(doc(db, "countries", c.iso), { name: c.name, isoCode: c.iso, createdAt: serverTimestamp() })
        })
        await batch.commit()
      }
    }
    seedRegistry()
  }, [db, user])

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
      toast({ title: "AI Neural Blockage", description: "Suggestion engine timed out.", variant: "destructive" })
    } finally {
      setIsSuggesting(false)
    }
  }

  const addSuggestion = (keyword: string) => {
    if (!keywords.includes(keyword)) setKeywords([...keywords, keyword])
  }

  const handleQuickAdd = async (type: 'tld' | 'category' | 'country') => {
    if (!user) return
    const id = Date.now().toString()
    if (type === 'tld' && newEntry.tld) {
      const formatted = newEntry.tld.startsWith('.') ? newEntry.tld : `.${newEntry.tld}`
      const customId = formatted.replace('.', '')
      await setDoc(doc(db, "tlds", customId), { name: formatted, createdAt: serverTimestamp(), adminUserId: user.uid })
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
    toast({ title: "Registry Updated", description: "Master list expanded successfully." })
  }

  const handleDeploy = async () => {
    if (!user) return
    if (!campaignName || keywords.length === 0) {
      toast({ title: "Configuration Invalid", description: "Descriptor and Search Cluster are required.", variant: "destructive" })
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
        scheduledDateTime: mode === 'scheduled' ? (scheduledDate ? scheduledDate.toISOString() : null) : null,
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
      }

      toast({ title: "Deployment Successful", description: mode === 'instant' ? "Extraction clusters are initializing." : "Campaign has been queued." })
      setTimeout(() => router.push('/dashboard'), 2500)
    } catch (err) {
      setIsDeploying(false)
      toast({ title: "Deployment Failed", description: "Handshake rejected.", variant: "destructive" })
    }
  }

  if (isUserLoading) return null

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <FuturisticLoader isVisible={isDeploying} status={`DEPLOYING CLUSTER: ${campaignName}...`} />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-headline font-bold text-white mb-2 tracking-tighter">Cluster Deployment</h1>
              <p className="text-muted-foreground text-lg">Configure your multi-node scraping engine with targeted parameters.</p>
            </div>
            <Button 
              className="h-12 bg-primary hover:bg-primary/90 px-10 font-black tracking-widest uppercase shadow-[0_0_20px_hsl(var(--primary)/0.3)]"
              onClick={handleDeploy}
              disabled={isDeploying}
            >
              Launch Engine
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="bg-card border-white/5 shadow-2xl">
                <CardHeader>
                  <CardTitle className="font-headline text-xl">Identity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Engine Descriptor</Label>
                    <Input 
                      placeholder="e.g. Fintech Leads V2" 
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
                    <Zap className="h-5 w-5 text-primary mr-3" /> Targeting Cluster
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Search Keywords</Label>
                    <div className="relative">
                      <Input 
                        placeholder="Enter seed keyword..." 
                        className="bg-secondary/30 border-white/10 pr-14 h-14 text-lg"
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
                            {isSuggesting ? <Loader2 className="animate-spin h-5 w-5" /> : <Sparkles className="h-6 w-6" />}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[500px] p-0 shadow-2xl border-white/10 bg-card/95 backdrop-blur-xl" align="end">
                          <div className="p-5 border-b border-white/5 bg-primary/5 flex items-center justify-between">
                            <h4 className="font-headline font-bold text-lg">AI Targeting Neural Suggestions</h4>
                            <Button variant="ghost" size="icon" onClick={() => setAiSuggestions(null)}><X className="h-4 w-4" /></Button>
                          </div>
                          <ScrollArea className="h-[350px]">
                            <div className="p-6 space-y-6">
                              {aiSuggestions && (
                                <>
                                  <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-3">Broad Targeting</p>
                                    <div className="flex flex-wrap gap-2">
                                      {aiSuggestions.shortTailKeywords.map(k => (
                                        <Badge key={k} variant="secondary" className="cursor-pointer hover:bg-primary transition-all" onClick={() => addSuggestion(k)}>+ {k}</Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase mb-3">Niche Targeting</p>
                                    <div className="flex flex-wrap gap-2">
                                      {aiSuggestions.longTailKeywords.map(k => (
                                        <Badge key={k} variant="outline" className="cursor-pointer hover:border-accent transition-all" onClick={() => addSuggestion(k)}>+ {k}</Badge>
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
                      {keywords.length === 0 && <p className="text-xs text-muted-foreground italic p-2">Add base keywords to initialize discovery...</p>}
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
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-black tracking-widest">DOMAINS</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Execution Mode</Label>
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
                          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Target Launch Time</p>
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
              {/* TLDs Selection */}
              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-headline flex items-center tracking-widest uppercase">
                    TLDs <Badge variant="secondary" className="ml-3 bg-white/5">{selectedTlds.length}</Badge>
                  </CardTitle>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10"><Plus className="h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-4 bg-card border-white/10 w-64">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3">Add Custom TLD</p>
                      <div className="flex space-x-2">
                        <Input placeholder=".tech" className="h-9 bg-white/5" value={newEntry.tld} onChange={(e) => setNewEntry({...newEntry, tld: e.target.value})} />
                        <Button size="sm" onClick={() => handleQuickAdd('tld')}>Add</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search registry..." className="h-10 pl-9 bg-secondary/30 border-white/5" value={tldSearch} onChange={(e) => setTldSearch(e.target.value)} />
                  </div>
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-1">
                      {dbTlds?.filter(t => t.name.includes(tldSearch)).map(tld => (
                        <div key={tld.id} className="flex items-center space-x-3 p-2.5 rounded-lg hover:bg-white/5 group">
                          <Checkbox 
                            id={`tld-${tld.id}`}
                            checked={selectedTlds.includes(tld.name.replace('.', ''))} 
                            onCheckedChange={() => {
                              const clean = tld.name.replace('.', '')
                              setSelectedTlds(prev => prev.includes(clean) ? prev.filter(t => t !== clean) : [...prev, clean])
                            }} 
                          />
                          <label htmlFor={`tld-${tld.id}`} className="text-sm text-muted-foreground group-hover:text-white cursor-pointer transition-colors font-code">{tld.name}</label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Categories Selection */}
              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-headline flex items-center tracking-widest uppercase">
                    Verticals <Badge variant="secondary" className="ml-3 bg-white/5">{selectedCategories.length}</Badge>
                  </CardTitle>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10"><Plus className="h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-4 bg-card border-white/10 w-64">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-3">Add Custom Vertical</p>
                      <div className="flex space-x-2">
                        <Input placeholder="Fintech" className="h-9 bg-white/5" value={newEntry.category} onChange={(e) => setNewEntry({...newEntry, category: e.target.value})} />
                        <Button size="sm" onClick={() => handleQuickAdd('category')}>Add</Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search verticals..." className="h-10 pl-9 bg-secondary/30 border-white/5" value={categorySearch} onChange={(e) => setCategorySearch(e.target.value)} />
                  </div>
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-1">
                      {dbCats?.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => (
                        <div key={cat.id} className="flex items-center space-x-3 p-2.5 rounded-lg hover:bg-white/5 group">
                          <Checkbox 
                            id={`cat-${cat.id}`}
                            checked={selectedCategories.includes(cat.name)} 
                            onCheckedChange={() => setSelectedCategories(prev => prev.includes(cat.name) ? prev.filter(c => c !== cat.name) : [...prev, cat.name])} 
                          />
                          <label htmlFor={`cat-${cat.id}`} className="text-sm text-muted-foreground group-hover:text-white cursor-pointer transition-colors">{cat.name}</label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Regions Selection */}
              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader className="pb-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-headline flex items-center tracking-widest uppercase">
                    Regions <Badge variant="secondary" className="ml-3 bg-white/5">{selectedCountries.length}</Badge>
                  </CardTitle>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10"><Plus className="h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-4 bg-card border-white/10 w-72 space-y-3">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Add Custom Region</p>
                      <Input placeholder="Country Name" className="h-9 bg-white/5" value={newEntry.countryName} onChange={(e) => setNewEntry({...newEntry, countryName: e.target.value})} />
                      <Input placeholder="ISO Code (e.g. US)" maxLength={2} className="h-9 bg-white/5 uppercase" value={newEntry.countryIso} onChange={(e) => setNewEntry({...newEntry, countryIso: e.target.value})} />
                      <Button size="sm" className="w-full" onClick={() => handleQuickAdd('country')}>Add Region</Button>
                    </PopoverContent>
                  </Popover>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input placeholder="Search regions..." className="h-10 pl-9 bg-secondary/30 border-white/5" value={countrySearch} onChange={(e) => setCountrySearch(e.target.value)} />
                  </div>
                  <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-1">
                      {dbCountries?.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase())).map(country => (
                        <div key={country.id} className="flex items-center space-x-3 p-2.5 rounded-lg hover:bg-white/5 group">
                          <Checkbox 
                            id={`country-${country.id}`}
                            checked={selectedCountries.includes(country.isoCode)} 
                            onCheckedChange={() => setSelectedCountries(prev => prev.includes(country.isoCode) ? prev.filter(c => c !== country.isoCode) : [...prev, country.isoCode])} 
                          />
                          <label htmlFor={`country-${country.id}`} className="text-sm text-muted-foreground group-hover:text-white cursor-pointer transition-colors flex items-center">
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
