"use client"

import { useEffect, useState } from "react"
import { Cpu, Globe, ShieldAlert, Terminal, Zap, Activity, Network, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"

interface FuturisticLoaderProps {
  isVisible: boolean
  status?: string
}

export function FuturisticLoader({ isVisible, status }: FuturisticLoaderProps) {
  const [binaryStream, setBinaryStream] = useState<string[]>([])
  const [activeStep, setActiveStep] = useState(0)

  const messages = [
    "INITIALIZING AI SCANNER...",
    "HARVESTING DATA NODES...",
    "BYPASSING FIREWALLS...",
    "COMPILING INTELLIGENCE...",
    "ESTABLISHING NEURAL LINK...",
    "DECRYPTING PACKET STREAM...",
  ]

  useEffect(() => {
    if (!isVisible) return

    // Generate binary streams
    const interval = setInterval(() => {
      const stream = Array.from({ length: 15 }, () => 
        Math.random() > 0.5 ? "1" : "0"
      ).join("")
      setBinaryStream(prev => [stream, ...prev].slice(0, 20))
      setActiveStep(s => (s + 1) % messages.length)
    }, 800)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505] overflow-hidden">
      {/* Background Neural Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Matrix Binary Rain (Left & Right) */}
      <div className="absolute inset-y-0 left-4 w-12 flex flex-col gap-1 text-[10px] font-code text-primary/40 overflow-hidden select-none">
        {binaryStream.map((s, i) => <span key={i} className="animate-flicker">{s}</span>)}
      </div>
      <div className="absolute inset-y-0 right-4 w-12 flex flex-col gap-1 text-[10px] font-code text-accent/40 overflow-hidden select-none text-right">
        {binaryStream.map((s, i) => <span key={i} className="animate-flicker">{s}</span>)}
      </div>

      <div className="relative z-10 w-full max-w-2xl px-8 flex flex-col items-center">
        {/* Core Scanner Ring */}
        <div className="relative w-64 h-64 mb-12 flex items-center justify-center">
          {/* Outer Pulsing Glow */}
          <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse-glow" />
          
          {/* Radar Sweep */}
          <div className="absolute inset-0 rounded-full border border-accent/10">
            <div className="absolute inset-0 rounded-full border-t-2 border-accent animate-spin-slow" />
          </div>

          {/* AI Neural Nodes */}
          <div className="absolute inset-4 rounded-full border border-dashed border-white/5 animate-spin-reverse">
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_#6366f1]" />
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-accent shadow-[0_0_10px_#38bdf8]" />
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80]" />
          </div>

          {/* Central Processor */}
          <div className="relative z-20 flex h-32 w-32 items-center justify-center rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-accent/10" />
            <Activity className="h-16 w-16 text-white animate-pulse" />
            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary animate-scanning" />
          </div>
        </div>

        {/* Intelligence Status Text */}
        <div className="text-center space-y-6 w-full">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Terminal className="h-3 w-3 text-accent" />
            <span className="text-[10px] font-code text-accent uppercase tracking-[0.3em] animate-flicker">
              {messages[activeStep]}
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black text-white tracking-tighter italic">
              WEB HUNTER <span className="text-primary">PRO</span>
            </h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {status || "Advanced Intelligence Extraction in Progress"}
            </p>
          </div>

          {/* Data Extraction Sequence */}
          <div className="max-w-xs mx-auto grid grid-cols-2 gap-4 text-left">
             <div className="flex items-center space-x-2">
                <div className="w-1 h-1 rounded-full bg-primary animate-ping" />
                <span className="text-[9px] font-code text-muted-foreground">NODES: 4,092 ACTIVE</span>
             </div>
             <div className="flex items-center space-x-2">
                <div className="w-1 h-1 rounded-full bg-accent animate-ping" />
                <span className="text-[9px] font-code text-muted-foreground">PORT: 80/443 OPEN</span>
             </div>
             <div className="flex items-center space-x-2">
                <div className="w-1 h-1 rounded-full bg-green-400 animate-ping" />
                <span className="text-[9px] font-code text-muted-foreground">STATUS: BYPASSING</span>
             </div>
             <div className="flex items-center space-x-2">
                <div className="w-1 h-1 rounded-full bg-purple-400 animate-ping" />
                <span className="text-[9px] font-code text-muted-foreground">STREAM: 2.4 GB/S</span>
             </div>
          </div>

          {/* Main Progress Bar */}
          <div className="relative h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-green-400 transition-all duration-1000 ease-in-out" 
              style={{ width: `${((activeStep + 1) / messages.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes flicker {
          0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100% { opacity: 1; }
          20%, 21.999%, 63%, 63.999%, 65%, 69.999% { opacity: 0.4; }
        }
        @keyframes scanning {
          0% { transform: translateY(-130px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(130px); opacity: 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-flicker { animation: flicker 3s linear infinite; }
        .animate-scanning { animation: scanning 2s linear infinite; }
        .animate-spin-slow { animation: spin-slow 4s linear infinite; }
        .animate-spin-reverse { animation: spin-reverse 8s linear infinite; }
        .shadow-glow { box-shadow: 0 0 20px -5px hsl(var(--primary)); }
      `}</style>
    </div>
  )
}
