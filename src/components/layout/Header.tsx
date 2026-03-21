"use client"

import { Bell, Search, Activity, Cpu } from "lucide-react"
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { notifications } from "@/app/lib/mock-data"
import { Button } from "@/components/ui/button"

export function Header() {
  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="h-16 border-b bg-background/50 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex items-center space-x-6">
        <div className="flex items-center text-sm font-medium text-muted-foreground">
          <Activity className="h-4 w-4 mr-2 text-accent" />
          System: <span className="text-accent ml-1 font-bold">OPTIMAL</span>
        </div>
        <div className="flex items-center text-sm font-medium text-muted-foreground">
          <Cpu className="h-4 w-4 mr-2 text-primary" />
          Queue: <span className="text-white ml-1">1,245 Jobs</span>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <input 
            type="text" 
            placeholder="Search campaigns..." 
            className="h-9 w-64 bg-secondary/50 border border-border rounded-full pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(90,212,255,0.8)]" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 mr-4" align="end">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-headline font-semibold">Notifications</h3>
              {unreadCount > 0 && <Badge variant="secondary">{unreadCount} New</Badge>}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 border-b last:border-0 hover:bg-secondary/30 transition-colors cursor-pointer ${n.unread ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-sm font-semibold text-white">{n.title}</h4>
                    <span className="text-[10px] text-muted-foreground">{n.time}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {n.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="p-3 text-center border-t">
              <Button variant="link" size="sm" className="text-xs text-primary">
                View all activities
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}