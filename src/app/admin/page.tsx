
"use client"

import { useState, useMemo } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Settings, Users, Shield, Database, Plus, Edit2, Trash2, CheckCircle2, Search, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase"
import { collection, doc, deleteDoc, serverTimestamp, setDoc } from "firebase/firestore"
import { COUNTRIES, TLDS, CATEGORIES } from "@/app/lib/constants"

export default function AdminPage() {
  const { toast } = useToast()
  const db = useFirestore()

  // Real-time Firestore Collections
  const tldsQuery = useMemoFirebase(() => collection(db, "tlds"), [db])
  const categoriesQuery = useMemoFirebase(() => collection(db, "categories"), [db])
  const countriesQuery = useMemoFirebase(() => collection(db, "countries"), [db])

  const { data: dbTlds } = useCollection(tldsQuery)
  const { data: dbCategories } = useCollection(categoriesQuery)
  const { data: dbCountries } = useCollection(countriesQuery)

  const [newTld, setNewTld] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newCountry, setNewCountry] = useState({ name: "", iso: "" })

  const handleAddTld = () => {
    const formatted = newTld.startsWith(".") ? newTld : `.${newTld}`
    if (!newTld) return
    if (dbTlds?.some(t => t.name === formatted)) {
      toast({ title: "Duplicate entry", description: `TLD ${formatted} already exists.`, variant: "destructive" })
      return
    }
    const id = formatted.replace('.', '')
    setDoc(doc(db, "tlds", id), {
      name: formatted,
      description: "Added via Admin Panel",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    setNewTld("")
    toast({ title: "Success", description: `Added TLD: ${formatted}` })
  }

  const handleAddCategory = () => {
    if (!newCategory) return
    if (dbCategories?.some(c => c.name.toLowerCase() === newCategory.toLowerCase())) {
      toast({ title: "Duplicate entry", description: `Category ${newCategory} already exists.`, variant: "destructive" })
      return
    }
    const id = newCategory.toLowerCase().replace(/\s/g, '-')
    setDoc(doc(db, "categories", id), {
      name: newCategory,
      description: "Added via Admin Panel",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    setNewCategory("")
    toast({ title: "Success", description: `Added Category: ${newCategory}` })
  }

  const handleAddCountry = () => {
    if (!newCountry.name || !newCountry.iso) return
    if (dbCountries?.some(c => c.isoCode.toUpperCase() === newCountry.iso.toUpperCase())) {
      toast({ title: "Duplicate entry", description: `Country ISO ${newCountry.iso} already exists.`, variant: "destructive" })
      return
    }
    const id = newCountry.iso.toUpperCase()
    setDoc(doc(db, "countries", id), {
      name: newCountry.name,
      isoCode: newCountry.iso.toUpperCase(),
      description: "Added via Admin Panel",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    setNewCountry({ name: "", iso: "" })
    toast({ title: "Success", description: `Added Country: ${newCountry.name}` })
  }

  const handleDelete = (col: string, id: string) => {
    deleteDoc(doc(db, col, id))
    toast({ title: "Deleted", description: "Entry removed from master registry." })
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-y-auto">
        <Header />
        
        <main className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-headline font-bold text-white mb-1">Administrative Control</h1>
              <p className="text-muted-foreground">Manage system configuration, personnel, and data protocols.</p>
            </div>
          </div>

          <Tabs defaultValue="metadata" className="w-full">
            <TabsList className="bg-secondary/50 p-1 mb-8">
              <TabsTrigger value="personnel" className="flex items-center px-6">
                <Users className="h-4 w-4 mr-2" /> Personnel
              </TabsTrigger>
              <TabsTrigger value="protocols" className="flex items-center px-6">
                <Shield className="h-4 w-4 mr-2" /> Protocols & Permissions
              </TabsTrigger>
              <TabsTrigger value="metadata" className="flex items-center px-6">
                <Database className="h-4 w-4 mr-2" /> Metadata Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personnel" className="space-y-6">
              <Card className="bg-card border-white/5">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-headline">System Administrators</CardTitle>
                    <CardDescription>Manage accounts with backend access.</CardDescription>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" /> Create New Admin
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5">
                        <TableHead className="font-headline">Identity</TableHead>
                        <TableHead className="font-headline">Access Level</TableHead>
                        <TableHead className="font-headline">Last Activity</TableHead>
                        <TableHead className="font-headline text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        { name: 'System Admin', email: 'admin@webhunter.pro', role: 'Super Admin', last: 'Now' }
                      ].map((admin, i) => (
                        <TableRow key={i} className="border-white/5">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {admin.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{admin.name}</p>
                                <p className="text-xs text-muted-foreground">{admin.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-primary/30 text-primary">{admin.role}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{admin.last}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white">
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="protocols" className="space-y-6">
              <Card className="bg-card border-white/5">
                <CardHeader>
                  <CardTitle className="font-headline">Access Protocols</CardTitle>
                  <CardDescription>Define granular permissions for administrative tiers.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="space-y-6">
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest border-b border-white/5 pb-2">Analyst Tier</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {[
                        { label: 'View Dashboard', desc: 'Read-only access to main stats.' },
                        { label: 'Access Results', desc: 'View and browse extracted domains.' },
                        { label: 'Run Validation', desc: 'Trigger MX record checks.' },
                        { label: 'Export Data', desc: 'Download CSV datasets.' },
                        { label: 'Campaign Creation', desc: 'Configure and start new runs.', disabled: true },
                        { label: 'Admin Access', desc: 'Modify system users.', disabled: true },
                      ].map((p, i) => (
                        <div key={i} className="flex items-start justify-between space-x-4">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">{p.label}</Label>
                            <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                          </div>
                          <Switch defaultChecked={!p.disabled} disabled={p.disabled} />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* TLDs Management */}
                <Card className="bg-card border-white/5">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-headline flex items-center justify-between">
                      TLDs
                      <Badge variant="secondary" className="bg-white/5">{dbTlds?.length || 0}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input 
                        placeholder=".com" 
                        className="h-8 bg-secondary/30 text-xs" 
                        value={newTld}
                        onChange={(e) => setNewTld(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddTld()}
                      />
                      <Button size="sm" className="h-8 text-[10px]" onClick={handleAddTld}>Add</Button>
                    </div>
                    <ScrollArea className="h-72 pr-2">
                      <div className="space-y-2">
                        {dbTlds?.map(tld => (
                          <div key={tld.id} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 text-xs">
                             <span className="text-white font-medium">{tld.name}</span>
                             <button 
                               className="text-muted-foreground hover:text-destructive transition-colors"
                               onClick={() => handleDelete("tlds", tld.id)}
                             >
                               <Trash2 className="h-3 w-3" />
                             </button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Categories Management */}
                <Card className="bg-card border-white/5">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-headline flex items-center justify-between">
                      Categories
                      <Badge variant="secondary" className="bg-white/5">{dbCategories?.length || 0}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Input 
                        placeholder="Technology" 
                        className="h-8 bg-secondary/30 text-xs" 
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                      />
                      <Button size="sm" className="h-8 text-[10px]" onClick={handleAddCategory}>Add</Button>
                    </div>
                    <ScrollArea className="h-72 pr-2">
                      <div className="space-y-2">
                        {dbCategories?.map(cat => (
                          <div key={cat.id} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 text-xs">
                             <span className="text-white font-medium">{cat.name}</span>
                             <button 
                               className="text-muted-foreground hover:text-destructive transition-colors"
                               onClick={() => handleDelete("categories", cat.id)}
                             >
                               <Trash2 className="h-3 w-3" />
                             </button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Countries Management */}
                <Card className="bg-card border-white/5">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-headline flex items-center justify-between">
                      Countries
                      <Badge variant="secondary" className="bg-white/5">{dbCountries?.length || 0}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        placeholder="Name" 
                        className="h-8 bg-secondary/30 text-xs" 
                        value={newCountry.name}
                        onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })}
                      />
                      <Input 
                        placeholder="ISO" 
                        className="h-8 bg-secondary/30 text-xs" 
                        value={newCountry.iso}
                        maxLength={2}
                        onChange={(e) => setNewCountry({ ...newCountry, iso: e.target.value })}
                      />
                    </div>
                    <Button size="sm" className="h-8 text-[10px] w-full" onClick={handleAddCountry}>Add Country</Button>
                    <ScrollArea className="h-64 pr-2">
                      <div className="space-y-2">
                        {dbCountries?.map(country => (
                          <div key={country.id} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 text-xs">
                             <div className="flex items-center gap-2">
                               <Badge variant="outline" className="text-[10px] h-4 px-1">{country.isoCode}</Badge>
                               <span className="text-white font-medium">{country.name}</span>
                             </div>
                             <button 
                               className="text-muted-foreground hover:text-destructive transition-colors"
                               onClick={() => handleDelete("countries", country.id)}
                             >
                               <Trash2 className="h-3 w-3" />
                             </button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
