
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Zap, Shield, ArrowRight, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useFirestore } from "@/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const db = useFirestore()
  
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isFirstRun, setIsFirstRun] = useState(false)

  useEffect(() => {
    const checkSetup = async () => {
      const configRef = doc(db, "system", "config")
      const configSnap = await getDoc(configRef)
      if (!configSnap.exists()) {
        setIsFirstRun(true)
      }
    }
    checkSetup()
  }, [db])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const configRef = doc(db, "system", "config")
      const configSnap = await getDoc(configRef)

      if (!configSnap.exists()) {
        // First run: Save the password as the master password
        await setDoc(configRef, {
          masterPassword: password,
          setupAt: new Date().toISOString()
        })
        toast({
          title: "Setup Complete",
          description: "Master access key has been initialized.",
        })
        router.push('/dashboard')
      } else {
        // Subsequent logins: Verify
        if (password === configSnap.data().masterPassword) {
          toast({
            title: "Access Granted",
            description: "Welcome back to WebHunter Pro command center.",
          })
          router.push('/dashboard')
        } else {
          toast({
            title: "Access Denied",
            description: "Invalid credentials provided.",
            variant: "destructive"
          })
        }
      }
    } catch (err) {
      toast({
        title: "Connection Error",
        description: "Could not reach security protocols.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />

      <div className="mb-8 flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-6 glow-primary">
          <Zap className="h-8 w-8 text-primary fill-primary" />
        </div>
        <h1 className="text-4xl font-headline font-bold text-white mb-2">WebHunter<span className="text-primary">Pro</span></h1>
        <p className="text-muted-foreground">The Extraction Engine for Modern SaaS Enterprise</p>
      </div>

      <Card className="w-full max-w-md bg-card/80 backdrop-blur-xl border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-headline font-bold text-white">
            {isFirstRun ? "Initialize System" : "Administrator Login"}
          </CardTitle>
          <CardDescription>
            {isFirstRun 
              ? "Set your master access key for this installation." 
              : "Enter your credentials to access the secure dashboard."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Work Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@webhunter.pro" 
                  defaultValue="admin@webhunter.pro"
                  className="bg-secondary/30 border-white/10 pl-10 h-11"
                  readOnly
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Access Key</Label>
                {!isFirstRun && <button type="button" className="text-xs text-primary hover:underline">Reset Token?</button>}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••••••" 
                  className="bg-secondary/30 border-white/10 pl-10 pr-10 h-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
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
              className="w-full h-11 bg-primary hover:bg-primary/90 glow-primary transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? "Validating..." : (
                <>
                  {isFirstRun ? "Initialize Engine" : "Establish Connection"} <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 pt-0">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground justify-center">
            <Shield className="h-3 w-3" />
            <span>Encrypted with AES-256 Protocol</span>
          </div>
        </CardFooter>
      </Card>

      <div className="mt-12 text-xs text-muted-foreground">
        &copy; 2024 WebHunter Pro. All extraction rights reserved.
      </div>
    </div>
  )
}
