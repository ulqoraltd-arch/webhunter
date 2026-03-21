"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  PlusCircle, 
  BarChart3, 
  Database, 
  ShieldCheck, 
  Download, 
  Settings, 
  LogOut,
  Zap
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'New Campaign', href: '/campaigns/new', icon: PlusCircle },
  { name: 'Results', href: '/results', icon: Database },
  { name: 'Validation', href: '/validation', icon: ShieldCheck },
  { name: 'Exports', href: '/export', icon: Download },
  { name: 'Admin Panel', href: '/admin', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-sidebar border-r h-full">
      <div className="flex items-center h-16 px-6 border-b">
        <Zap className="h-6 w-6 text-primary mr-2 fill-primary" />
        <span className="text-xl font-headline font-bold text-white">WebHunter<span className="text-primary">Pro</span></span>
      </div>
      
      <div className="flex-1 py-6 space-y-1 px-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group",
                isActive 
                  ? "bg-primary text-white" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 mr-3 transition-colors",
                isActive ? "text-white" : "text-sidebar-foreground group-hover:text-white"
              )} />
              {item.name}
            </Link>
          )
        })}
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center p-3 mb-2 rounded-lg bg-card/40 border border-white/5">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
            <span className="text-xs font-bold text-primary">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">John Doe</p>
            <p className="text-xs text-muted-foreground truncate">Admin Account</p>
          </div>
        </div>
        <Link 
          href="/login"
          className="flex items-center px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4 mr-3" />
          Sign Out
        </Link>
      </div>
    </div>
  )
}