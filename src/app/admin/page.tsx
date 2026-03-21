
"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Users, Shield, Database, Plus, Edit2, Trash2, Key, Search, X, Loader2 } from "lucide-react"
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
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from "@/firebase"
import { collection, doc, deleteDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"

export default function AdminPage() {
  const { toast } = useToast()
  const db = useFirestore()
  const router = useRouter()
  const { user, isUserLoading } = useUser()

  // Verify SuperAdmin status
  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "admins", user.uid)
  }, [db, user])
  const { data: profile } = useDoc(profileRef)

  useEffect(() => {
    if (!isUserLoading && profile && profile.role !== 'SuperAdmin') {
      toast({ title: "Access Restricted", description: "This module requires SuperAdmin clearance.", variant: "destructive" })
      router.push('/dashboard')
    }
  }, [profile, isUserLoading, router, toast])

  // Real-time Firestore Collections
  const tldsQuery = useMemoFirebase(() => collection(db, "tlds"), [db])
  const categoriesQuery = useMemoFirebase(() => collection(db, "categories"), [db])
  const countriesQuery = useMemoFirebase(() => collection(db, "countries"), [db])
  const adminsQuery = useMemoFirebase(() => collection(db, "admins"), [db])

  const { data: dbTlds } = useCollection(tldsQuery)
  const { data: dbCategories } = useCollection(categoriesQuery)
  const { data: dbCountries } = useCollection(countriesQuery)
  const { data: dbAdmins } = useCollection(adminsQuery)

  // Protocols Config
  const protocolRef = useMemoFirebase(() => doc(db, "system", "protocols"), [db])
  const { data: protocols } = useDoc(protocolRef)

  const [newTld, setNewTld] = useState("")
  const [newCategory, setNewCategory] = useState("")
  const [newCountry, setNewCountry] = useState({ name: "", iso: "" })
  
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ name: "", passkey: "", role: "Analyst" })

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.passkey) return
    const adminId = `admin-${Date.now()}`
    
    await setDoc(doc(db, "admins", adminId), {
      id: adminId,
      name: newAdmin.name,
      passkey: newAdmin.passkey,
      role: newAdmin.role,
      adminUserId: user?.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    toast({ title: "Personnel Added", description: `${newAdmin.name} has been registered as ${newAdmin.role}.` })
    setIsAdminDialogOpen(false)
    setNewAdmin({ name: "", passkey: "", role: "Analyst" })
  }

  const handleProtocolToggle = async (key: string, value: boolean) => {
    if (!protocolRef) return
    await setDoc(protocolRef, { [key]: value }, { merge: true })
    toast({ title: "Protocol Updated", description: "System permissions synchronized." })
  }

  const handleAddTld = () => {
    const formatted = newTld.startsWith(".") ? newTld : `.${newTld}`
    if (!newTld) return
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

  if (profile?.role !== 'SuperAdmin') return null

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

          <Tabs defaultValue="personnel" className="w-full">
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
                    <CardTitle className="font-headline">Authorized Personnel</CardTitle>
                    <CardDescription>Manage administrative accounts and access tiers.</CardDescription>
                  </div>
                  <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsAdminDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Register New Personnel
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/5">
                        <TableHead className="font-headline">Identity</TableHead>
                        <TableHead className="font-headline">Access Tier</TableHead>
                        <TableHead className="font-headline text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dbAdmins?.map((admin) => (
                        <TableRow key={admin.id} className="border-white/5">
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${admin.role === 'SuperAdmin' ? 'bg-primary/20 text-primary' : 'bg-accent/20 text-accent'}`}>
                                {admin.name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-white">{admin.name}</p>
                                <div className="flex items-center text-xs text-muted-foreground">
                                  <Key className="h-3 w-3 mr-1" /> Passkey Secured
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={admin.role === 'SuperAdmin' ? "border-primary/30 text-primary" : "border-accent/30 text-accent"}>
                              {admin.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              {admin.id !== user?.uid && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete("admins", admin.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
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
                  <CardTitle className="font-headline">Access Protocols (Analyst Tier)</CardTitle>
                  <CardDescription>Define granular restrictions for non-superadmin users.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                      { key: 'canViewDashboard', label: 'View Dashboard', desc: 'Read-only access to main telemetry.' },
                      { key: 'canAccessResults', label: 'Access Repository', desc: 'View discovered domains.' },
                      { key: 'canRunValidation', label: 'Run Validation', desc: 'Trigger MX record checks.' },
                      { key: 'canExportData', label: 'Export Datasets', desc: 'Generate CSV binary streams.' },
                      { key: 'canCreateCampaigns', label: 'Campaign Creation', desc: 'Deploy new extraction clusters.' },
                    ].map((p) => (
                      <div key={p.key} className="flex items-start justify-between space-x-4">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-medium">{p.label}</Label>
                          <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                        </div>
                        <Switch 
                          checked={protocols?.[p.key] ?? true} 
                          onCheckedChange={(v) => handleProtocolToggle(p.key, v)}
                        />
                      </div>
                    ))}
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
                      <Input placeholder=".com" className="h-8 bg-secondary/30 text-xs" value={newTld} onChange={(e) => setNewTld(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddTld()} />
                      <Button size="sm" className="h-8 text-[10px]" onClick={handleAddTld}>Add</Button>
                    </div>
                    <ScrollArea className="h-72 pr-2">
                      <div className="space-y-2">
                        {dbTlds?.map(tld => (
                          <div key={tld.id} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 text-xs">
                             <span className="text-white font-medium">{tld.name}</span>
                             <button className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete("tlds", tld.id)}><Trash2 className="h-3 w-3" /></button>
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
                      <Input placeholder="Technology" className="h-8 bg-secondary/30 text-xs" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()} />
                      <Button size="sm" className="h-8 text-[10px]" onClick={handleAddCategory}>Add</Button>
                    </div>
                    <ScrollArea className="h-72 pr-2">
                      <div className="space-y-2">
                        {dbCategories?.map(cat => (
                          <div key={cat.id} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 text-xs">
                             <span className="text-white font-medium">{cat.name}</span>
                             <button className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete("categories", cat.id)}><Trash2 className="h-3 w-3" /></button>
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
                      <Input placeholder="Name" className="h-8 bg-secondary/30 text-xs" value={newCountry.name} onChange={(e) => setNewCountry({ ...newCountry, name: e.target.value })} />
                      <Input placeholder="ISO" className="h-8 bg-secondary/30 text-xs" value={newCountry.iso} maxLength={2} onChange={(e) => setNewCountry({ ...newCountry, iso: e.target.value })} />
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
                             <button className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete("countries", country.id)}><Trash2 className="h-3 w-3" /></button>
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

        <Dialog open={isAdminDialogOpen} onOpenChange={setIsAdminDialogOpen}>
          <DialogContent className="bg-card border-white/10 text-white">
            <DialogHeader>
              <DialogTitle className="font-headline">Register Intelligence Personnel</DialogTitle>
              <DialogDescription>Assign an identity, role, and passkey for system access.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Personnel Name</Label>
                <Input 
                  placeholder="e.g. Sarah Jenkins" 
                  className="bg-secondary/30 border-white/10"
                  value={newAdmin.name}
                  onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Access Tier</Label>
                <Select value={newAdmin.role} onValueChange={(v) => setNewAdmin({...newAdmin, role: v})}>
                  <SelectTrigger className="bg-secondary/30 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SuperAdmin">SuperAdmin (Full Control)</SelectItem>
                    <SelectItem value="Analyst">Analyst (Restricted)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Initial Passkey</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="password"
                    placeholder="Enter secure key" 
                    className="bg-secondary/30 border-white/10 pl-10"
                    value={newAdmin.passkey}
                    onChange={(e) => setNewAdmin({ ...newAdmin, passkey: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAdminDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddAdmin}>Initialize Identity</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
