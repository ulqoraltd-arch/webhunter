"use client"

import { useState } from "react"
import { Bell, Search, Cpu, Sparkles, CheckCircle, AlertCircle, FileText, Loader2, Menu, X } from "lucide-react"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase"
import { collection, query, orderBy, limit, doc, updateDoc, where } from "firebase/firestore"
import { formatDistanceToNow } from "date-fns"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { Sidebar } from "./Sidebar"

export function Header() {
  const { user } = useUser()
  const db = useFirestore()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Real-time Telemetry Data from Firestore
  const activeCampaignsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "admins", user.uid, "campaigns"),
      where("status", "==", "Running")
    )
  }, [db, user])

  const { data: activeCampaigns } = useCollection(activeCampaignsQuery)
  
  // Real status based on active jobs
  const engineStatus = activeCampaigns && activeCampaigns.length > 0 ? "Operational" : "Standby"
  const workerLoad = activeCampaigns ? Math.min(100, activeCampaigns.length * 15) : 0

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null
    return query(
      collection(db, "admins", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(10)
    )
  }, [db, user])

  const { data: dbNotifications, isLoading } = useCollection(notificationsQuery)
  const unreadCount = dbNotifications?.filter(n => !n.isRead).length || 0

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'campaignStarted': return <Sparkles className="h-4 w-4 text-accent" />
      case 'campaignCompleted': return <CheckCircle className="h-4 w-4 text-primary" />
      case 'exportCompleted': return <FileText className="h-4 w-4 text-primary" />
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />
      default: return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  const markAsRead = (id: string) => {
    if (!user || !db) return
    const ref = doc(db, "admins", user.uid, "notifications", id)
    updateDoc(ref, { isRead: true })
  }

  return (
    <header className="h-20 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40 px-4 md:px-8 py-4 flex items-center justify-between border-white/5">
      <div className="flex items-center">
        {/* Mobile Sidebar Trigger */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden mr-4 h-11 w-11 rounded-2xl hover:bg-white/5 group">
              <Menu className="h-6 w-6 text-muted-foreground group-hover:text-white transition-colors" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 bg-sidebar border-none">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <Sidebar className="flex" />
          </SheetContent>
        </Sheet>

        <div className="flex items-center space-x-4 md:space-x-10">
          <div className="flex items-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            <div className={`h-2 w-2 rounded-full mr-3 animate-pulse shadow-[0_0_10px_currentcolor] ${engineStatus === 'Operational' ? 'bg-accent text-accent' : 'bg-muted text-muted'}`} />
            <span className="hidden sm:inline">Engine Status:</span>
            <span className="text-white ml-1 md:ml-2 accent-glow">{engineStatus}</span>
          </div>
          <div className="flex items-center text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
            <Cpu className="h-4 w-4 mr-2 text-primary" />
            <span className="hidden sm:inline">Worker Load:</span>
            <span className="text-white ml-1 md:ml-2 text-glow">{workerLoad}%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-6">
        {/* Universal Search - Desktop */}
        <div className="hidden md:block relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input 
            type="text" 
            placeholder="Universal Command Search..." 
            className="h-11 w-64 lg:w-80 bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white/[0.08] transition-all placeholder:text-muted-foreground/50 font-medium"
          />
        </div>

        {/* Universal Search - Mobile Icon Only */}
        <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden h-11 w-11 rounded-2xl hover:bg-white/5 group">
              <Search className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card/95 backdrop-blur-3xl border-white/10 p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-headline font-black uppercase tracking-widest text-white mb-4 italic">Universal Search</DialogTitle>
            </DialogHeader>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <input 
                type="text" 
                placeholder="Search cluster repository..." 
                className="h-14 w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white/[0.08] transition-all"
                autoFocus
              />
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mt-4 font-black">Press Enter to initiate extraction search.</p>
          </DialogContent>
        </Dialog>

        <div className="hidden sm:block h-6 w-px bg-white/10" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-2xl hover:bg-white/5 group">
              <Bell className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-3 right-3 w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(90,212,255,1)] ring-2 ring-background" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-32px)] sm:w-[400px] p-0 mr-4 mt-4 bg-card/95 backdrop-blur-3xl border-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.8)]" align="end">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center space-x-3">
                <h3 className="font-headline font-black text-white uppercase tracking-wider italic">System Registry</h3>
                <Badge className="bg-accent/10 text-accent border-0 text-[10px] px-2 font-black">{unreadCount} NEW</Badge>
              </div>
            </div>
            <ScrollArea className="max-h-[60vh] sm:max-h-[500px]">
              <div className="flex flex-col">
                {isLoading ? (
                  <div className="p-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : dbNotifications?.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    className={`p-6 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-all cursor-pointer group ${!n.isRead ? 'bg-primary/[0.03]' : ''}`}
                  >
                    <div className="flex gap-5">
                      <div className={`mt-1 p-2.5 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all border border-white/5`}>
                        {getNotificationIcon(n.eventType || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1.5">
                          <h4 className={`text-sm font-black uppercase tracking-tight truncate ${!n.isRead ? 'text-white' : 'text-muted-foreground'}`}>{n.title}</h4>
                          <span className="text-[9px] font-black text-muted-foreground uppercase shrink-0 ml-3 opacity-50">
                            {n.createdAt ? formatDistanceToNow(n.createdAt.toDate()) + ' ago' : 'Recent'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 italic font-medium">
                          {n.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {(!dbNotifications || dbNotifications.length === 0) && !isLoading && (
                  <div className="p-12 text-center text-muted-foreground italic text-xs uppercase font-black tracking-widest opacity-20">
                    No telemetry logged.
                  </div>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
