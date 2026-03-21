"use client"

import { useState } from "react"
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
import { COUNTRIES, TLDS, CATEGORIES } from "@/app/lib/constants"

export default function NewCampaignPage() {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<{shortTailKeywords: string[], longTailKeywords: string[]} | null>(null)

  // Multi-select states
  const [selectedTlds, setSelectedTlds] = useState<string[]>([".com"])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["SaaS", "Technology"])
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["US"])

  // Search filters
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
      toast({
        title: "Query required",
        description: "Please enter a base keyword or query first.",
        variant: "destructive"
      })
      return
    }
    
    setIsSuggesting(true)
    try {
      const result = await suggestKeywordsForCampaign({ query: query || keywords[0] })
      setAiSuggestions(result)
    } catch (err) {
      toast({
        title: "AI Failed",
        description: "Failed to generate suggestions. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSuggesting(false)
    }
  }

  const addSuggestion = (keyword: string) => {
    if (!keywords.includes(keyword)) {
      setKeywords([...keywords, keyword])
    }
  }

  const toggleTld = (tld: string) => {
    setSelectedTlds(prev => prev.includes(tld) ? prev.filter(t => t !== tld) : [...prev, tld])
  }

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])
  }

  const toggleCountry = (iso: string) => {
    setSelectedCountries(prev => prev.includes(iso) ? prev.filter(c => c !== iso) : [...prev, iso])
  }

  const filteredTlds = TLDS.filter(t => t.toLowerCase().includes(tldSearch.toLowerCase()))
  const filteredCategories = CATEGORIES.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()))
  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.iso.toLowerCase().includes(countrySearch.toLowerCase())
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 max-w-6xl mx-auto w-full">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-headline font-bold text-white mb-2">Deploy New Campaign</h1>
              <p className="text-muted-foreground text-lg">Configure your extraction engine with precision targeting and AI optimization.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="h-11 border-white/10 bg-white/5">Save as Blueprint</Button>
              <Button className="h-11 bg-primary hover:bg-primary/90 px-8 font-bold glow-primary">Deploy Engine</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-card border-white/5 shadow-2xl overflow-visible">
                <CardHeader>
                  <CardTitle className="flex items-center font-headline text-xl">
                    <Zap className="h-5 w-5 text-primary mr-3" />
                    Targeting & Keywords
                  </CardTitle>
                  <CardDescription>Define the search perimeter for domain discovery.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-4">
                    <Label htmlFor="keywords" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Search Cluster</Label>
                    <div className="relative group">
                      <Input 
                        id="keywords"
                        placeholder="Type keyword and press Enter (e.g. 'Software as a Service')" 
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
                        <PopoverContent className="w-[500px] p-0 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-white/10 bg-card/95 backdrop-blur-xl" align="end">
                          <div className="p-5 border-b border-white/5 bg-primary/5">
                            <h4 className="font-headline font-bold flex items-center text-lg">
                              <Sparkles className="h-5 w-5 mr-3 text-accent" />
                              AI Semantic Analysis
                            </h4>
                            <p className="text-xs text-muted-foreground mt-1">Recommended keyword clusters for higher domain relevance.</p>
                          </div>
                          <ScrollArea className="h-[400px]">
                            <div className="p-6 space-y-6">
                              {aiSuggestions && (
                                <>
                                  <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Short Tail (Broad Reach)</p>
                                    <div className="flex flex-wrap gap-2">
                                      {aiSuggestions.shortTailKeywords.map(k => (
                                        <Badge 
                                          key={k} 
                                          variant="secondary" 
                                          className="cursor-pointer hover:bg-primary text-sm py-1.5 px-3 transition-colors"
                                          onClick={() => addSuggestion(k)}
                                        >
                                          + {k}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-3">Long Tail (High Intent)</p>
                                    <div className="flex flex-wrap gap-2">
                                      {aiSuggestions.longTailKeywords.map(k => (
                                        <Badge 
                                          key={k} 
                                          variant="outline" 
                                          className="cursor-pointer hover:border-accent hover:text-accent text-sm py-1.5 px-3 transition-colors"
                                          onClick={() => addSuggestion(k)}
                                        >
                                          + {k}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                          </ScrollArea>
                          <div className="p-4 text-center border-t border-white/5 bg-white/5">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white" onClick={() => setAiSuggestions(null)}>Dismiss recommendations</Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-wrap gap-2.5 min-h-[48px] p-3 bg-secondary/10 rounded-xl border border-dashed border-white/5">
                      {keywords.length === 0 && <span className="text-sm text-muted-foreground italic">No keywords added yet...</span>}
                      {keywords.map((k, i) => (
                        <Badge key={i} className="bg-primary/20 text-primary border-primary/30 px-4 py-2 flex items-center text-sm font-semibold rounded-lg shadow-sm">
                          {k}
                          <span 
                            className="ml-3 cursor-pointer text-muted-foreground hover:text-white transition-colors"
                            onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))}
                          >
                            <X className="h-3.5 w-3.5" />
                          </span>
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
                    Engine Strategy
                  </CardTitle>
                  <CardDescription>Configure volume quotas and execution schedules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-4">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Domain Quota (Valid Emails Only)</Label>
                      <div className="relative">
                        <Input type="number" defaultValue={2000} className="bg-secondary/30 border-white/10 h-14 text-xl font-bold pl-4" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-bold bg-white/5 px-2 py-1 rounded">DOMAINS</span>
                      </div>
                      <p className="text-xs text-muted-foreground italic">
                        The engine will auto-scale domain discovery until required count of domains with valid emails is successfully extracted.
                      </p>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Deployment Mode</Label>
                      <Tabs defaultValue="instant" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1 h-12">
                          <TabsTrigger value="instant" className="h-10">Instant Run</TabsTrigger>
                          <TabsTrigger value="schedule" className="h-10">Scheduled</TabsTrigger>
                        </TabsList>
                        <TabsContent value="instant" className="pt-4">
                          <div className="flex items-center p-4 bg-accent/5 rounded-xl border border-accent/10">
                             <Activity className="h-5 w-5 mr-3 text-accent animate-pulse" />
                             <span className="text-sm text-accent font-medium">Workers will spin up immediately across redundant API layers.</span>
                          </div>
                        </TabsContent>
                        <TabsContent value="schedule" className="pt-4 space-y-4">
                          <Button variant="outline" className="w-full h-12 flex justify-start text-muted-foreground bg-secondary/30 border-white/10 hover:bg-secondary/50">
                            <CalendarIcon className="h-5 w-5 mr-3" /> Select Target Launch Window
                          </Button>
                        </TabsContent>
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
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 mr-3 text-accent" /> TLDs
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent">{selectedTlds.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search TLDs..." 
                      className="h-10 bg-secondary/30 text-sm pl-10 border-white/5" 
                      value={tldSearch}
                      onChange={(e) => setTldSearch(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-[180px] pr-4">
                    <div className="space-y-2">
                      {filteredTlds.map(tld => (
                        <div key={tld} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <Checkbox 
                            id={`tld-${tld}`} 
                            checked={selectedTlds.includes(tld)}
                            onCheckedChange={() => toggleTld(tld)}
                          />
                          <label htmlFor={`tld-${tld}`} className="text-sm font-medium leading-none cursor-pointer flex-1">{tld}</label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-headline flex items-center justify-between">
                    <div className="flex items-center">
                      <Tag className="h-5 w-5 mr-3 text-primary" /> Categories
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">{selectedCategories.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search categories..." 
                      className="h-10 bg-secondary/30 text-sm pl-10 border-white/5" 
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-[180px] pr-4">
                    <div className="space-y-2">
                      {filteredCategories.map(cat => (
                        <div key={cat} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <Checkbox 
                            id={`cat-${cat}`} 
                            checked={selectedCategories.includes(cat)}
                            onCheckedChange={() => toggleCategory(cat)}
                          />
                          <label htmlFor={`cat-${cat}`} className="text-sm font-medium leading-none cursor-pointer flex-1">{cat}</label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="bg-card border-white/5 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg font-headline flex items-center justify-between">
                    <div className="flex items-center">
                      <Flag className="h-5 w-5 mr-3 text-accent" /> Regions
                    </div>
                    <Badge variant="secondary" className="bg-accent/10 text-accent">{selectedCountries.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search regions..." 
                      className="h-10 bg-secondary/30 text-sm pl-10 border-white/5" 
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-[180px] pr-4">
                    <div className="space-y-2">
                      {filteredCountries.map(country => (
                        <div key={country.iso} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                          <Checkbox 
                            id={`country-${country.iso}`} 
                            checked={selectedCountries.includes(country.iso)}
                            onCheckedChange={() => toggleCountry(country.iso)}
                          />
                          <label htmlFor={`country-${country.iso}`} className="text-sm font-medium leading-none cursor-pointer flex-1">
                            {country.name} ({country.iso})
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
