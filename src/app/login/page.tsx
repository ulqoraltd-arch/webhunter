"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Zap, Shield, ArrowRight, Lock, Eye, EyeOff, Terminal, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useFirestore, useAuth } from "@/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { signInAnonymously } from "firebase/auth"
import { FuturisticLoader } from "@/components/ui/futuristic-loader"

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
      <FuturisticLoader isVisible={isLoading} status={isFirstRun ? "INITIALIZING MASTER ENGINE..." : "SYNCING NEURAL NODES..."} />
      
      {/* Background Ambience */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

      <div className="mb-12 flex flex-col items-center text-center">
        <div className="relative mb-8">
           <div className="absolute inset-0 bg-primary/20 blur-3xl animate-pulse" />
           <div className="relative w-20 h-20 bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden group">
              <Zap className="h-10 w-10 text-primary group-hover:scale-125 transition-transform duration-500" />
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-primary animate-scanning" />
           </div>
        </div>
        <h1 className="text-5xl font-headline font-black text-white mb-2 tracking-tighter">
          WEB HUNTER <span className="text-primary">PRO</span>
        </h1>
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-white/5 rounded border border-white/5">
           <Terminal className="h-3 w-3 text-accent" />
           <p className="text-[10px] font-code text-muted-foreground uppercase tracking-widest">Advanced Intelligence Node v1.4.2</p>
        </div>
      </div>

      <Card className="w-full max-w-md bg-black/40 backdrop-blur-3xl border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-headline font-bold text-white flex items-center">
             {isFirstRun ? "Engine Setup" : "Neural Handshake"}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {isFirstRun 
              ? "Initialize this intelligence node with a master encryption key." 
              : "Synchronize your administrative passkey to gain entry."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Security Passkey</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="********" 
                  className="bg-white/5 border-white/10 pl-10 pr-10 h-12 text-sm focus:ring-primary focus:border-primary/40 transition-all font-code"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold tracking-widest uppercase transition-all duration-500 shadow-glow hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
              disabled={isLoading}
            >
              {isLoading ? "ESTABLISHING LINK..." : (
                <>
                  {isFirstRun ? "INITIALIZE ENGINE" : "GAIN ACCESS"} <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-0">
          <div className="flex items-center space-x-2 text-[8px] font-bold text-muted-foreground uppercase tracking-widest justify-center">
            <Shield className="h-2 w-2 text-green-400" />
            <span>256-BIT NEURAL ENCRYPTION ACTIVE</span>
          </div>
        </CardFooter>
      </Card>

      <div className="mt-16 flex items-center space-x-8 opacity-20 pointer-events-none">
        <Activity className="h-4 w-4 text-primary animate-pulse" />
        <TermItem label="LINK" value="ENCRYPTED" />
        <TermItem label="LOAD" value="2.1%" />
        <TermItem label="GEO" value="DISTRIBUTED" />
      </div>

      <style jsx>{`
        @keyframes scanning {
          0% { transform: translateY(-40px); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(40px); opacity: 0; }
        }
        .animate-scanning { animation: scanning 1.5s linear infinite; }
        .shadow-glow { box-shadow: 0 0 15px -5px hsl(var(--primary)); }
      `}</style>
    </div>
  )
}

function TermItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[7px] font-black text-muted-foreground uppercase">{label}</span>
      <span className="text-[9px] font-code text-white font-bold">{value}</span>
    </div>
  )
}
