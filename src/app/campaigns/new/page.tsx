"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Sparkles, Plus, Globe, Tag, Flag, Search, Calendar as CalendarIcon, Zap } from "lucide-react"
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

export default function NewCampaignPage() {
  const { toast } = useToast()
  const [query, setQuery] = useState("")
  const [keywords, setKeywords] = useState<string[]>([])
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<{shortTailKeywords: string[], longTailKeywords: string[]} | null>(null)

  const handleAddKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      setKeywords([...keywords, query.trim()])
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

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 max-w-5xl mx-auto w-full">
          <div className="mb-8">
            <h1 className="text-3xl font-headline font-bold text-white mb-2">Initialize Extraction Engine</h1>
            <p className="text-muted-foreground">Configure your scraping parameters for targeted domain discovery.</p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <section className="space-y-6">
              <Card className="bg-card border-white/5 shadow-2xl overflow-visible">
                <CardHeader>
                  <CardTitle className="flex items-center font-headline">
                    <Zap className="h-5 w-5 text-primary mr-2" />
                    Targeting & Keywords
                  </CardTitle>
                  <CardDescription>Enter keywords to seed the search engine discovery.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label htmlFor="keywords">Primary Search Query / Keywords</Label>
                    <div className="relative">
                      <Input 
                        id="keywords"
                        placeholder="e.g. 'Email marketing software', 'Best CRM for realtors'" 
                        className="bg-secondary/30 border-white/10 pr-12 h-12"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleAddKeyword}
                      />
                      <Popover open={!!aiSuggestions}>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-primary/20 text-accent"
                            disabled={isSuggesting}
                            onClick={handleAiSuggest}
                          >
                            <Sparkles className={`h-5 w-5 ${isSuggesting ? 'animate-spin' : ''}`} />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[450px] p-0" align="end">
                          <div className="p-4 border-b bg-primary/5">
                            <h4 className="font-headline font-bold flex items-center">
                              <Sparkles className="h-4 w-4 mr-2 text-accent" />
                              AI Recommendations
                            </h4>
                          </div>
                          <div className="p-4 space-y-4 max-h-[400px] overflow-y-auto">
                            {aiSuggestions && (
                              <>
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Short Tail (Broad)</p>
                                  <div className="flex flex-wrap gap-2">
                                    {aiSuggestions.shortTailKeywords.map(k => (
                                      <Badge 
                                        key={k} 
                                        variant="secondary" 
                                        className="cursor-pointer hover:bg-primary/20"
                                        onClick={() => addSuggestion(k)}
                                      >
                                        + {k}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Long Tail (Specific)</p>
                                  <div className="flex flex-wrap gap-2">
                                    {aiSuggestions.longTailKeywords.map(k => (
                                      <Badge 
                                        key={k} 
                                        variant="outline" 
                                        className="cursor-pointer hover:border-accent hover:text-accent"
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
                          <div className="p-3 text-center border-t">
                            <Button variant="ghost" size="sm" onClick={() => setAiSuggestions(null)}>Close suggestions</Button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {keywords.map((k, i) => (
                        <Badge key={i} className="bg-primary/20 text-primary border-primary/30 px-3 py-1 flex items-center">
                          {k}
                          <span 
                            className="ml-2 cursor-pointer text-muted-foreground hover:text-white"
                            onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))}
                          >
                            ×
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-card border-white/5 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-headline flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-accent" /> TLDs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input placeholder="Search .com, .io..." className="h-8 bg-secondary/30 text-xs" />
                        <Button size="icon" variant="outline" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {['.com', '.net', '.org', '.io', '.ai', '.tech'].map(tld => (
                          <div key={tld} className="flex items-center space-x-2">
                            <Checkbox id={tld} />
                            <label htmlFor={tld} className="text-sm font-medium leading-none">{tld}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-white/5 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-headline flex items-center">
                      <Tag className="h-4 w-4 mr-2 text-primary" /> Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input placeholder="SaaS, Agency..." className="h-8 bg-secondary/30 text-xs" />
                        <Button size="icon" variant="outline" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {['Technology', 'Marketing', 'Finance', 'Real Estate', 'Healthcare'].map(cat => (
                          <div key={cat} className="flex items-center space-x-2">
                            <Checkbox id={cat} />
                            <label htmlFor={cat} className="text-sm font-medium leading-none">{cat}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-white/5 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-sm font-headline flex items-center">
                      <Flag className="h-4 w-4 mr-2 text-accent" /> Countries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <Input placeholder="US, UK, DE..." className="h-8 bg-secondary/30 text-xs" />
                        <Button size="icon" variant="outline" className="h-8 w-8"><Plus className="h-4 w-4" /></Button>
                      </div>
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {['United States (US)', 'United Kingdom (UK)', 'Germany (DE)', 'Canada (CA)', 'Australia (AU)'].map(country => (
                          <div key={country} className="flex items-center space-x-2">
                            <Checkbox id={country} />
                            <label htmlFor={country} className="text-sm font-medium leading-none">{country}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card border-white/5 shadow-2xl">
                <CardHeader>
                  <CardTitle className="font-headline">Engine Parameters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <Label>Required Results Count (Domains with Emails)</Label>
                      <Input type="number" defaultValue={2000} className="bg-secondary/30 border-white/10" />
                      <p className="text-xs text-muted-foreground">The engine will continue scraping until this quota is met.</p>
                    </div>
                    <div className="space-y-3">
                      <Label>Campaign Execution Mode</Label>
                      <Tabs defaultValue="instant" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
                          <TabsTrigger value="instant">Instant Run</TabsTrigger>
                          <TabsTrigger value="schedule">Schedule</TabsTrigger>
                        </TabsList>
                        <TabsContent value="instant" className="pt-4">
                          <p className="text-xs text-muted-foreground flex items-center">
                            <Activity className="h-3 w-3 mr-2 text-accent" />
                            Engine will spin up workers immediately upon deployment.
                          </p>
                        </TabsContent>
                        <TabsContent value="schedule" className="pt-4 space-y-4">
                          <div className="flex items-center gap-4">
                            <Button variant="outline" className="w-full flex justify-start text-muted-foreground bg-secondary/30 border-white/10">
                              <CalendarIcon className="h-4 w-4 mr-2" /> Select Date & Time
                            </Button>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-4 pt-4">
                <Button variant="ghost">Save Draft</Button>
                <Button className="px-12 bg-primary hover:bg-primary/90 glow-primary h-12 text-lg">Deploy Campaign</Button>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

function Activity(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}