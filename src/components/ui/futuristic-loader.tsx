
"use client"

import { useEffect, useState } from "react"
import { Activity, Cpu, Globe, Mail, ShieldCheck, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface FuturisticLoaderProps {
  isVisible: boolean
  status?: string
}

export function FuturisticLoader({ isVisible, status }: FuturisticLoaderProps) {
  const [step, setStep] = useState(0)
  
  const steps = [
    { label: "Targeting Cluster", icon: Zap, color: "text-primary" },
    { label: "Domain Discovery", icon: Globe, color: "text-accent" },
    { label: "Extraction Protocol", icon: Activity, color: "text-primary" },
    { label: "MX Validation", icon: ShieldCheck, color: "text-accent" },
  ]

  useEffect(() => {
    if (!isVisible) return
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % steps.length)
    }, 1500)
    return () => clearInterval(interval)
  }, [isVisible, steps.length])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-xl">
      <div className="relative w-full max-w-md p-8 text-center">
        {/* Central Pulsing Core */}
        <div className="relative mb-12 flex justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 blur-2xl" />
          <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl bg-secondary/50 border border-white/10 shadow-2xl">
            <Cpu className="h-12 w-12 text-primary animate-pulse" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-headline font-bold text-white tracking-tight">
              Initializing Engine
            </h3>
            <p className="text-sm text-muted-foreground">
              {status || "Synchronizing with redundancy layers..."}
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {steps.map((s, i) => {
              const Icon = s.icon
              const isActive = i === step
              const isPast = i < step
              return (
                <div key={i} className="flex flex-col items-center space-y-2">
                  <div className={cn(
                    "h-10 w-10 rounded-xl border flex items-center justify-center transition-all duration-500",
                    isActive ? "bg-primary/20 border-primary shadow-glow ring-2 ring-primary/20 scale-110" : 
                    isPast ? "bg-primary/10 border-primary/50 opacity-50" : 
                    "bg-secondary/50 border-white/5 opacity-30"
                  )}>
                    <Icon className={cn("h-5 w-5", s.color)} />
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-widest",
                    isActive ? "text-white" : "text-muted-foreground opacity-50"
                  )}>
                    {s.label.split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary animate-shimmer" 
                 style={{ backgroundSize: '200% 100%' }} />
          </div>
        </div>

        {/* Binary Stream Decoration */}
        <div className="absolute -bottom-20 left-0 right-0 h-40 opacity-10 pointer-events-none overflow-hidden">
          <div className="flex flex-wrap justify-center gap-2 text-[8px] font-code text-primary animate-pulse">
            {Array.from({ length: 200 }).map((_, i) => (
              <span key={i}>{Math.round(Math.random())}</span>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
      `}</style>
    </div>
  )
}
