"use client"

import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { Settings, Users, Shield, Database, Plus, Edit2, Trash2, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"

export default function AdminPage() {
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
              </Shield>
              <TabsTrigger value="metadata" className="flex items-center px-6">
                <Database className="h-4 w-4 mr-2" /> Metadata Management
              </TabsTrigger>
            </TabsList>

            <TabsContent value="personnel" className="space-y-6">
              <Card className="bg-card border-white/5">
                <CardHeader className="flex flex-row items-center justify-between">
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
                        { name: 'John Doe', email: 'john@webhunter.pro', role: 'Super Admin', last: 'Now' },
                        { name: 'Sarah Miller', email: 'sarah@webhunter.pro', role: 'Analyst', last: '2h ago' },
                        { name: 'Michael Chen', email: 'm.chen@webhunter.pro', role: 'Campaign Mgr', last: '1 day ago' },
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
                {['TLDs', 'Categories', 'Countries'].map((type) => (
                  <Card key={type} className="bg-card border-white/5">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-headline flex items-center justify-between">
                        {type}
                        <Button variant="outline" size="icon" className="h-7 w-7"><Plus className="h-4 w-4" /></Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Input placeholder={`Add new ${type.slice(0, -1)}...`} className="h-8 bg-secondary/30 text-xs" />
                        <Button size="sm" className="h-8 text-[10px]">Add</Button>
                      </div>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                          <div key={i} className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/5 text-xs">
                             <span className="text-white font-medium">Value_{i}</span>
                             <button className="text-destructive hover:text-destructive/80"><Trash2 className="h-3 w-3" /></button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}