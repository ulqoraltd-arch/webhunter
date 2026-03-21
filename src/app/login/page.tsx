"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Zap, Shield, ArrowRight, Lock, Eye, EyeOff, Terminal, Activity, Globe, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useAuth } from "@/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { signInAnonymously } from "firebase/auth"
import { FuturisticLoader } from "@/components/ui/futuristic-loader"

const MatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}/?*&^%$#@!"
    const fontSize = 14
    const columns = canvas.width / fontSize
    const drops: number[] = []

    for (let i = 0; i < columns; i++) {
      drops[i] = 1
    }

    const draw = () => {
      ctx.fillStyle = "rgba(5, 5, 5, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#6366f1" // Primary theme color
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length))
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 33)
    return () => clearInterval(interval)
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 z-0 opacity-20" />
}

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  const auth = useAuth()
  
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFirstRun, setIsFirstRun] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    const initializeHandshake = async () => {
      try {
        await signInAnonymously(auth)
        const configRef = doc(db, "system", "config")
        const configSnap = await getDoc(configRef)
        if (!configSnap.exists()) {
          setIsFirstRun(true)
        }
      } catch (err) {
        console.error("System handshake failed", err)
      } finally {
        setIsInitializing(false)
      }
    }
    initializeHandshake()
  }, [db, auth])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setIsLoading(true)

    try {
      const user = auth.currentUser || (await signInAnonymously(auth)).user
      const uid = user.uid

      const configRef = doc(db, "system", "config")
      const configSnap = await getDoc(configRef)

      if (!configSnap.exists()) {
        await setDoc(configRef, {
          masterPassword: password,
          isInitialized: true,
          setupAt: serverTimestamp(),
          adminUserId: uid
        })
        
        await setDoc(doc(db, "admins", uid), {
          id: uid,
          name: "System Admin",
          role: "SuperAdmin",
          adminUserId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        toast({ title: "System Initialized", description: "Master access key secured. Initializing engine..." })
        setTimeout(() => router.push('/dashboard'), 3500)
      } else {
        if (password === configSnap.data().masterPassword) {
          toast({ title: "Access Granted", description: "Synchronizing intelligence nodes..." })
          const adminRef = doc(db, "admins", uid)
          const adminSnap = await getDoc(adminRef)
          if (!adminSnap.exists()) {
            await setDoc(adminRef, {
              id: uid,
              name: "Authorized Admin",
              role: "SystemAdmin",
              adminUserId: uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            })
          }
          setTimeout(() => router.push('/dashboard'), 3500)
        } else {
          setIsLoading(false)
          toast({ title: "Access Denied", description: "Invalid security passkey.", variant: "destructive" })
        }
      }
    } catch (err) {
      setIsLoading(false)
      toast({ title: "Link Error", description: "Handshake failure.", variant: "destructive" })
    }
  }

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#050505] text-primary">
        <Activity className="h-12 w-12 animate-pulse mb-4" />
        <p className="text-[10px] font-code uppercase tracking-[0.5em] animate-flicker">Waking Neural Network...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <MatrixBackground />
      <FuturisticLoader isVisible={isLoading} status={isFirstRun ? "INITIALIZING MASTER ENGINE..." : "SYNCING NEURAL NODES..."} />
      
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <div className="mb-12 flex flex-col items-center text-center relative z-10">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
           <div className="relative w-24 h-24 bg-black/60 border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl overflow-hidden group">
              <Zap className="h-12 w-12 text-primary group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute inset-x-0 bottom-0 h-1 bg-primary animate-scanning" />
           </div>
        </div>
        <h1 className="text-6xl font-headline font-black text-white mb-2 tracking-tighter italic">
          WEB HUNTER <span className="text-primary">PRO</span>
        </h1>
        <div className="inline-flex items-center space-x-3 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
           <Terminal className="h-3.5 w-3.5 text-primary" />
           <p className="text-[10px] font-code text-primary uppercase tracking-[0.4em] font-bold">Encrypted Authorization Layer</p>
        </div>
      </div>

      <Card className="w-full max-w-lg bg-black/60 backdrop-blur-3xl border-white/10 shadow-[0_60px_120px_-20px_rgba(0,0,0,1)] relative z-10 p-4">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-accent to-primary animate-pulse" />
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl font-headline font-black text-white uppercase italic tracking-tight">
               {isFirstRun ? "Initialize Engine" : "Master Node Access"}
            </CardTitle>
            <div className={`h-2.5 w-2.5 rounded-full ${isFirstRun ? 'bg-accent' : 'bg-primary'} animate-pulse shadow-[0_0_10px_currentColor]`} />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-3">
              <Label className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground flex items-center">
                <Lock className="h-3 w-3 mr-2" /> Security Handshake Required
              </Label>
              <div className="relative group">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="ENTER ACCESS KEY" 
                  className="bg-primary/5 border-white/10 h-16 text-lg tracking-[0.5em] focus:ring-primary focus:border-primary/40 transition-all font-code text-center uppercase font-black"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black tracking-[0.3em] uppercase transition-all duration-500 shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)] border-t border-white/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-3">
                  <Activity className="h-5 w-5 animate-spin" />
                  <span>SYNCING...</span>
                </div>
              ) : (
                <>
                  {isFirstRun ? "DEPLOY ENGINE" : "INITIALIZE LINK"} <ArrowRight className="ml-3 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-6 pt-4">
          <div className="w-full grid grid-cols-3 gap-4">
            <div className="h-0.5 bg-white/5" />
            <div className="h-0.5 bg-primary/20" />
            <div className="h-0.5 bg-white/5" />
          </div>
          <div className="flex items-center space-x-4 text-[9px] font-black text-muted-foreground uppercase tracking-widest justify-center">
             <div className="flex items-center">
               <Globe className="h-3 w-3 mr-1.5 text-accent" /> GEO-LOCK: OFF
             </div>
             <div className="w-1 h-1 rounded-full bg-white/20" />
             <div className="flex items-center">
               <Cpu className="h-3 w-3 mr-1.5 text-primary" /> LOAD: NOMINAL
             </div>
          </div>
        </CardFooter>
      </Card>

      <div className="mt-16 flex items-center space-x-12 opacity-30 pointer-events-none relative z-10">
        <TermItem label="HANDSHAKE" value="RSA-4096" />
        <TermItem label="NODE" value="DISTRIBUTED" />
        <TermItem label="BYPASS" value="ENABLED" />
      </div>

      <style jsx>{`
        @keyframes scanning {
          0% { transform: translateY(-40px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(40px); opacity: 0; }
        }
        .animate-scanning { animation: scanning 1.5s linear infinite; }
        .animate-flicker { animation: flicker 3s linear infinite; }
      `}</style>
    </div>
  )
}

function TermItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-1">{label}</span>
      <span className="text-[11px] font-code text-white font-bold italic">{value}</span>
    </div>
  )
}