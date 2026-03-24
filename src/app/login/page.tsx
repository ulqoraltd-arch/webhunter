
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Zap, Shield, ArrowRight, Lock, Eye, EyeOff, Terminal, Activity, Globe, Cpu, Network, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useAuth } from "@/firebase"
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"
import { signInAnonymously } from "firebase/auth"
import { FuturisticLoader } from "@/components/ui/futuristic-loader"

const AdvancedMatrixBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const characters = "0123456789ABCDEFｦｱｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ"
    const fontSize = 16
    const columns = canvas.width / fontSize
    const drops: number[] = []

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100
    }

    const draw = () => {
      ctx.fillStyle = "rgba(5, 5, 5, 0.15)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length))
        
        // Varying colors for depth
        const alpha = Math.random() * 0.5 + 0.2
        ctx.fillStyle = i % 10 === 0 ? `rgba(90, 212, 255, ${alpha})` : `rgba(99, 102, 241, ${alpha})`
        
        ctx.font = `${fontSize}px monospace`
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 33)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <canvas ref={canvasRef} className="opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
    </div>
  )
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
        // Initialize Root System
        await setDoc(configRef, {
          masterPassword: password,
          isInitialized: true,
          setupAt: serverTimestamp(),
          adminUserId: uid
        })
        
        await setDoc(doc(db, "admins", uid), {
          id: uid,
          name: "Root Administrator",
          role: "SuperAdmin",
          adminUserId: uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        toast({ title: "Master Key Established", description: "Encryption protocols synchronized." })
        setTimeout(() => router.push('/dashboard'), 4000)
      } else {
        // Validate against Master Password or individual Admin passkeys
        const masterPass = configSnap.data().masterPassword
        const isAdminQuery = query(collection(db, "admins"), where("passkey", "==", password))
        const adminSnap = await getDocs(isAdminQuery)
        
        const isAuthorized = (password === masterPass) || !adminSnap.empty

        if (isAuthorized) {
          toast({ title: "Access Granted", description: "Decrypting session tokens..." })
          // Removed auto-addition of user record here to satisfy "dont add it as user"
          setTimeout(() => router.push('/dashboard'), 4000)
        } else {
          setIsLoading(false)
          toast({ title: "Access Denied", description: "Signature mismatch detected.", variant: "destructive" })
        }
      }
    } catch (err) {
      setIsLoading(false)
      toast({ title: "Handshake Error", description: "Remote node rejected connection.", variant: "destructive" })
    }
  }

  if (isInitializing) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#050505] text-primary">
        <Network className="h-12 w-12 animate-pulse mb-4" />
        <p className="text-[10px] font-code uppercase tracking-[0.5em] animate-flicker">Awakening Distributed Nodes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden font-code">
      <AdvancedMatrixBackground />
      <FuturisticLoader isVisible={isLoading} status={isFirstRun ? "CONSTRUCTING ROOT DIRECTORY..." : "BYPASSING SECURITY LAYERS..."} />
      
      {/* Decorative HUD Elements */}
      <div className="absolute top-8 left-8 flex flex-col space-y-2 opacity-30 select-none pointer-events-none hidden lg:flex">
        <div className="flex items-center space-x-3 text-[10px] text-primary">
          <Terminal className="h-3 w-3" /> <span>SYS.LOG_ACTIVE</span>
        </div>
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-primary animate-scanning" />
        </div>
        <div className="flex items-center space-x-3 text-[10px] text-accent">
          <Cpu className="h-3 w-3" /> <span>NODE_CLUSTER_7A</span>
        </div>
      </div>

      <div className="absolute top-8 right-8 flex flex-col items-end space-y-2 opacity-30 select-none pointer-events-none hidden lg:flex">
        <div className="flex items-center space-x-3 text-[10px] text-accent">
           <span>ENCRYPTION: AES-4096</span> <Shield className="h-3 w-3" />
        </div>
        <div className="text-[8px] text-white/40 text-right">
          PACKET_LOSS: 0.00%<br/>
          LATENCY: 12ms
        </div>
      </div>

      <div className="mb-12 flex flex-col items-center text-center relative z-10 scale-110 lg:scale-125">
        <div className="relative mb-6">
           <div className="absolute inset-0 bg-primary/30 blur-[60px] animate-pulse rounded-full" />
           <div className="relative w-20 h-20 bg-black/80 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden group">
              <Zap className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-500 fill-primary/20" />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary animate-scanning" />
           </div>
        </div>
        <h1 className="text-5xl font-headline font-black text-white mb-2 tracking-tighter italic uppercase">
          WEB HUNTER <span className="text-primary text-glow">PRO</span>
        </h1>
        <div className="inline-flex items-center space-x-3 px-3 py-1 bg-primary/5 rounded border border-primary/10">
           <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
           <p className="text-[9px] font-code text-primary uppercase tracking-[0.4em] font-black">Secure Shell v4.2</p>
        </div>
      </div>

      <Card className="w-full max-w-md bg-black/40 backdrop-blur-3xl border-white/5 shadow-[0_0_100px_rgba(0,0,0,1)] relative z-10 p-1 overflow-hidden group hover:border-primary/20 transition-colors duration-700">
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
        <CardHeader className="space-y-3 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl font-headline font-black text-white uppercase italic tracking-tight">
                 {isFirstRun ? "System Root" : "Master Node"}
              </CardTitle>
              <CardDescription className="text-[10px] uppercase tracking-widest text-primary/60 font-black">
                {isFirstRun ? "Initialize Primary Credentials" : "Authorization Required"}
              </CardDescription>
            </div>
            <ShieldAlert className="h-6 w-6 text-primary/40" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-4">
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic text-center px-4">
                Synchronize your administrative passkey to gain entry. Encryption keys are generated per session.
              </p>
              <div className="relative group/input">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="MASTER PASSKEY" 
                  className="bg-white/5 border-white/10 h-16 text-md tracking-[0.6em] focus:ring-primary focus:border-primary/40 transition-all font-code text-center uppercase font-black placeholder:tracking-normal placeholder:opacity-20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-16 bg-primary hover:bg-primary/90 text-white font-black tracking-[0.4em] uppercase transition-all duration-700 shadow-glow relative overflow-hidden group/btn"
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-500" />
              <span className="relative flex items-center justify-center">
                {isLoading ? (
                  <>
                    <Activity className="h-5 w-5 animate-spin mr-3" />
                    SYNCING...
                  </>
                ) : (
                  <>
                    {isFirstRun ? "INITIALIZE" : "AUTHORIZE"} <ArrowRight className="ml-3 h-4 w-4 group-hover/btn:translate-x-2 transition-transform" />
                  </>
                )}
              </span>
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-2 pb-6 opacity-40">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="flex items-center justify-center space-x-6 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
             <span className="flex items-center"><Globe className="h-2.5 w-2.5 mr-1 text-primary" /> GLOBAL_SYNC: ON</span>
             <span className="flex items-center"><Cpu className="h-2.5 w-2.5 mr-1 text-accent" /> ENGINE_LOAD: 0%</span>
          </div>
        </CardFooter>
      </Card>

      <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-20 hidden lg:grid">
        <StatItem label="IP_ADDR" value="[HIDDEN]" />
        <StatItem label="SOCKETS" value="ESTABLISHED" />
        <StatItem label="THREAD" value="PRIMARY" />
        <StatItem label="BYPASS" value="STANDBY" />
      </div>

      <style jsx>{`
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        .animate-flicker { animation: flicker 0.1s infinite; }
        .text-glow { text-shadow: 0 0 15px hsla(var(--primary), 0.6); }
      `}</style>
    </div>
  )
}

function StatItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[7px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-1">{label}</span>
      <span className="text-[10px] text-white font-bold italic tracking-widest">{value}</span>
    </div>
  )
}
