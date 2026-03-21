
"use client"

import { Bell, Search, Activity, Cpu, Sparkles, CheckCircle, AlertCircle, FileText } from "lucide-react"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { notifications } from "@/app/lib/mock-data"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export function Header() {
  const unreadCount = notifications.filter(n => n.unread).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'campaignStarted': return <Sparkles className="h-4 w-4 text-accent" />
      case 'campaignCompleted': return <CheckCircle className="h-4 w-4 text-primary" />
      case 'exportCompleted': return <FileText className="h-4 w-4 text-primary" />
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />
      default: return <Bell className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <header className="h-16 border-b bg-background/80 backdrop-blur-xl sticky top-0 z-40 px-8 flex items-center justify-between border-white/5 pt-2">
      <div className="flex items-center space-x-10">
        <div className="flex items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <div className="h-2 w-2 rounded-full bg-accent mr-2 animate-pulse shadow-[0_0_8px_hsl(var(--accent))]" />
          Engine Status: <span className="text-white ml-2">Operational</span>
        </div>
        <div className="flex items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
          <Cpu className="h-4 w-4 mr-2 text-primary" />
          Worker Load: <span className="text-white ml-2">24%</span>
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input 
            type="text" 
            placeholder="Universal Command Search..." 
            className="h-10 w-80 bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white/[0.08] transition-all placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="h-6 w-px bg-white/10" />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-white/5">
              <Bell className="h-5 w-5 text-muted-foreground group-hover:text-white transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(90,212,255,1)] ring-2 ring-background" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[380px] p-0 mr-4 mt-2 bg-card/95 backdrop-blur-2xl border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]" align="end">
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center space-x-2">
                <h3 className="font-headline font-bold text-white">System Events</h3>
                <Badge className="bg-accent/10 text-accent border-0 text-[10px] px-1.5">{unreadCount} New</Badge>
              </div>
            </div>
            <ScrollArea className="max-h-[450px]">
              <div className="flex flex-col">
                {notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-5 border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-all cursor-pointer group ${n.unread ? 'bg-primary/[0.03]' : ''}`}
                  >
                    <div className="flex gap-4">
                      <div className={`mt-1 p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors`}>
                        {getNotificationIcon(n.type || '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm font-bold truncate ${n.unread ? 'text-white' : 'text-muted-foreground'}`}>{n.title}</h4>
                          <span className="text-[9px] font-black text-muted-foreground uppercase shrink-0 ml-2">{n.time}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {n.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
