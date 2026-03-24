"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  PlusCircle, 
  Database, 
  ShieldCheck, 
  Download, 
  Settings, 
  LogOut,
  Zap,
  Loader2,
  Terminal,
  Layers
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase"
import { doc } from "firebase/firestore"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'canViewDashboard' },
  { name: 'Campaigns', href: '/campaigns', icon: Layers, permission: 'canViewDashboard' },
  { name: 'New Mission', href: '/campaigns/new', icon: PlusCircle, permission: 'canCreateCampaigns' },
  { name: 'Repository', href: '/results', icon: Database, permission: 'canAccessResults' },
  { name: 'Validation', href: '/validation', icon: ShieldCheck, permission: 'canRunValidation' },
  { name: 'Exports', href: '/export', icon: Download, permission: 'canExportData' },
  { name: 'Debug Terminal', href: '/debug', icon: Terminal, superOnly: true },
  { name: 'Admin Panel', href: '/admin', icon: Settings, superOnly: true },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const { user } = useUser()
  const db = useFirestore()

  const profileRef = useMemoFirebase(() => {
    if (!db || !user) return null
    return doc(db, "admins", user.uid)
  }, [db, user])
  
  const protocolRef = useMemoFirebase(() => {
    if (!db) return null
    return doc(db, "system", "protocols")
  }, [db])

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileRef)
  const { data: protocols } = useDoc(protocolRef)

  const isSuperAdmin = profile?.role === 'SuperAdmin'

  const filteredNavigation = navigation.filter(item => {
    if (isSuperAdmin) return true
    if (item.superOnly) return false
    if (item.permission && protocols) {
      return protocols[item.permission] !== false
    }
    return true
  })

  return (
    <div className={cn("hidden md:flex flex-col w-64 bg-sidebar border-r h-full relative transition-all duration-300", className)}>
      <div className="flex items-center h-16 px-6 border-b">
        <Zap className="h-6 w-6 text-primary mr-2 fill-primary" />
        <span className="text-xl font-headline font-bold text-white">WebHunter<span className="text-primary">Pro</span></span>
      </div>
      
      <div className="flex-1 py-6 space-y-1 px-3">
        <TooltipProvider delayDuration={0}>
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors group",
                      isActive 
                        ? "bg-primary text-white shadow-lg shadow-primary/20" 
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"
                    )}
                  >
                    <item.icon className={cn(
                      "h-5 w-5 mr-3 transition-colors",
                      isActive ? "text-white" : "text-sidebar-foreground group-hover:text-white"
                    )} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover border-white/10 text-xs font-bold uppercase tracking-widest md:hidden">
                  {item.name}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </div>

      <div className="p-4 border-t">
        <div className="flex items-center p-3 mb-2 rounded-lg bg-card/40 border border-white/5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${isSuperAdmin ? 'bg-primary/20 shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-accent/20'}`}>
            {isProfileLoading ? (
              <Loader2 className="h-3 w-3 animate-spin text-white" />
            ) : (
              <span className={`text-xs font-bold ${isSuperAdmin ? 'text-primary' : 'text-accent'}`}>
                {profile?.name?.charAt(0) || 'U'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profile?.name || 'Loading...'}</p>
            <p className="text-[10px] text-muted-foreground truncate uppercase font-bold tracking-tighter">
              {profile?.role || 'Authenticating...'}
            </p>
          </div>
        </div>
        <Link 
          href="/login"
          className="flex items-center px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors group"
        >
          <LogOut className="h-4 w-4 mr-3 group-hover:rotate-12 transition-transform" />
          Sign Out
        </Link>
      </div>
    </div>
  )
}
