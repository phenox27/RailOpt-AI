'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrainFront,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Shield,
  Zap,
  UserPlus,
  ArrowLeft,
  Phone,
  Building2,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Demo accounts for easy testing — team member logins
const DEMO_ACCOUNTS = [
  { email: 'admin@railopt.ai', password: 'admin123', role: 'Admin', name: 'Dhittika', initials: 'DH', color: 'bg-primary' },
  { email: 'planner@railopt.ai', password: 'planner123', role: 'Planner', name: 'Jeet', initials: 'JT', color: 'bg-[#1a237e]' },
  { email: 'control@railopt.ai', password: 'control123', role: 'Control Office', name: 'Diya', initials: 'DY', color: 'bg-blue-500' },
  { email: 'engineering@railopt.ai', password: 'eng123', role: 'Engineering', name: 'Debarshi', initials: 'DB', color: 'bg-blue-600' },
  { email: 'snt@railopt.ai', password: 'snt123', role: 'S&T', name: 'Rupam', initials: 'RP', color: 'bg-[#283593]' },
  { email: 'traction@railopt.ai', password: 'trac123', role: 'Traction', name: 'Alivia', initials: 'AL', color: 'bg-amber-600' },
]

interface SignInFormProps {
  onSuccess?: () => void
  onBack?: () => void
  initialTab?: 'signin' | 'signup'
}

export function SignInForm({ onSuccess, onBack, initialTab = 'signin' }: SignInFormProps) {
  const [activeTab, setActiveTab] = useState<string>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [department, setDepartment] = useState('')
  const [phone, setPhone] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter email and password')
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid credentials. Please try again.')
      } else if (result?.ok) {
        toast.success('Signed in successfully! Redirecting to dashboard...')
        // Force a full page reload to ensure session is properly set
        setTimeout(() => {
          window.location.href = '/'
        }, 800)
        onSuccess?.()
      }
    } catch {
      toast.error('An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password || !department) {
      toast.error('Please fill all required fields')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (!agreeTerms) {
      toast.error('Please agree to the Terms of Service')
      return
    }

    setIsLoading(true)
    try {
      // For now, register as a viewer role and auto-sign-in
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('This email is not pre-registered. Please contact your administrator for access, or use a demo account below.')
      } else if (result?.ok) {
        toast.success('Account activated! Redirecting to dashboard...')
        setTimeout(() => {
          window.location.href = '/'
        }, 800)
        onSuccess?.()
      }
    } catch {
      toast.error('An error occurred during sign up')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: demoEmail,
        password: demoPassword,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Demo login failed')
      } else if (result?.ok) {
        toast.success('Signed in successfully! Redirecting to dashboard...')
        setTimeout(() => {
          window.location.href = '/'
        }, 800)
        onSuccess?.()
      }
    } catch {
      toast.error('An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      const result = await signIn('google', { callbackUrl: '/', redirect: false })
      if (result?.error) {
        toast.error('Google sign-in is not configured yet. Please use email/password or a demo account.')
      } else if (result?.ok) {
        toast.success('Signed in with Google! Redirecting...')
        setTimeout(() => {
          window.location.href = '/'
        }, 800)
        onSuccess?.()
      }
    } catch {
      toast.error('Google sign-in is not available in this environment. Please use credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a2e] via-[#1a237e]/20 to-background p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />
      <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[#1a237e]/5 blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[#0d47a1]/5 blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        {/* Branding Header */}
        <div className="text-center mb-6">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute -top-2 left-0 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
          )}
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a237e] to-[#0d47a1] text-white shadow-lg shadow-[#1a237e]/30">
              <TrainFront className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">RailOpt AI</h1>
              <p className="text-xs text-muted-foreground -mt-0.5">Intelligent Block Planning System</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5 bg-[#e8eaf6] text-[#0d47a1] border-[#9fa8da] dark:bg-[#1a237e]/30 dark:text-[#9fa8da] dark:border-[#283593]">
              <Zap className="h-2.5 w-2.5 mr-0.5" />
              AI-Powered
            </Badge>
            <Badge variant="outline" className="text-[10px] px-2 py-0 h-5">
              Indian Railways
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            Ministry of Railways — Government of India / रेल मंत्रालय — भारत सरकार
          </p>
        </div>

        {/* Auth Card with Tabs */}
        <Card className="shadow-xl border-border/60 backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full rounded-none rounded-t-lg border-b bg-muted/30 h-11">
              <TabsTrigger value="signin" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium">
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                Sign In
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm text-sm font-medium">
                <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                Register
              </TabsTrigger>
            </TabsList>

            {/* ─── SIGN IN TAB ─── */}
            <TabsContent value="signin" className="mt-0">
              <CardHeader className="pb-3 pt-4 px-6">
                <CardTitle className="text-lg">Sign In</CardTitle>
                <CardDescription className="text-xs">
                  Enter your credentials to access the RailOpt AI platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                {/* Google Sign In */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 text-sm font-medium border-border/80 hover:bg-muted/50"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C8.07 20.49 10.9 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 8.9 1 6.07 2.51 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or sign in with email</span>
                  </div>
                </div>

                <form onSubmit={handleSignIn} className="space-y-3">
                  {/* Email field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-xs font-medium">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@railway.gov.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-8 text-sm h-9"
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password" className="text-xs font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-8 pr-8 text-sm h-9"
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember me & Forgot password */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked === true)}
                        className="h-3.5 w-3.5"
                      />
                      <Label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-[#0d47a1] hover:text-[#1a237e] dark:text-[#7986CB] dark:hover:text-[#9fa8da] font-medium transition-colors"
                      onClick={() => toast.info('Password reset is handled by your divisional administrator', { description: 'Contact admin@railopt.ai or use a demo account below for instant access.' })}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Submit button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#1a237e] to-[#0d47a1] hover:from-[#283593] hover:to-[#1565C0] text-white text-sm h-10 shadow-md shadow-[#1a237e]/20"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <Shield className="h-3.5 w-3.5 mr-1.5" />
                        Sign In to Dashboard
                      </>
                    )}
                  </Button>
                </form>

                <Separator />

                {/* Demo Accounts */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground text-center">
                    Quick Demo Access — Team Accounts
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {DEMO_ACCOUNTS.map((account) => (
                      <button
                        key={account.email}
                        type="button"
                        className="flex items-center gap-2 px-2.5 py-2 rounded-md border border-border hover:bg-muted/50 hover:border-border transition-all text-left group disabled:opacity-50"
                        onClick={() => handleDemoLogin(account.email, account.password)}
                        disabled={isLoading}
                        title={`Sign in as ${account.name} (${account.role})`}
                      >
                        <span className={cn(
                          'flex items-center justify-center w-7 h-7 rounded-full text-[9px] text-white font-bold shrink-0 shadow-sm',
                          account.color,
                        )}>
                          {account.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold text-foreground truncate group-hover:text-[#283593] dark:group-hover:text-[#7986CB] transition-colors">
                            {account.name}
                          </p>
                          <p className="text-[9px] text-muted-foreground truncate">
                            {account.role}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </TabsContent>

            {/* ─── SIGN UP TAB ─── */}
            <TabsContent value="signup" className="mt-0">
              <CardHeader className="pb-3 pt-4 px-6">
                <CardTitle className="text-lg">Register</CardTitle>
                <CardDescription className="text-xs">
                  Create your account to request access to the RailOpt AI platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6">
                {/* Google Sign Up */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-10 text-sm font-medium border-border/80 hover:bg-muted/50"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C8.07 20.49 10.9 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 8.9 1 6.07 2.51 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign up with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/50" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or register with email</span>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-3">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-xs font-medium">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="e.g. Dhittika"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="text-sm h-9"
                      disabled={isLoading}
                      autoComplete="name"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-xs font-medium">
                      Official Email <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@railway.gov.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-8 text-sm h-9"
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>
                  </div>

                  {/* Department */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-dept" className="text-xs font-medium">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <select
                        id="signup-dept"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full h-9 pl-8 pr-3 text-sm rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={isLoading}
                      >
                        <option value="">Select department</option>
                        <option value="operating">Operating (Control Office)</option>
                        <option value="engineering">Engineering</option>
                        <option value="snt">S&T (Signal & Telecom)</option>
                        <option value="traction">Traction / Electrical</option>
                        <option value="planning">Planning</option>
                        <option value="admin">Administration</option>
                      </select>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-phone" className="text-xs font-medium">
                      Phone Number
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        id="signup-phone"
                        type="tel"
                        placeholder="+91 XXXXX XXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-8 text-sm h-9"
                        disabled={isLoading}
                        autoComplete="tel"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-xs font-medium">
                      Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-8 pr-8 text-sm h-9"
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-confirm" className="text-xs font-medium">
                      Confirm Password <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        id="signup-confirm"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-8 pr-8 text-sm h-9"
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-2">
                    <Checkbox
                      id="terms"
                      checked={agreeTerms}
                      onCheckedChange={(checked) => setAgreeTerms(checked === true)}
                      className="h-3.5 w-3.5 mt-0.5"
                    />
                    <Label htmlFor="terms" className="text-[10px] text-muted-foreground cursor-pointer leading-relaxed">
                      I agree to the{' '}
                      <span className="text-[#0d47a1] dark:text-[#7986CB] font-medium">Terms of Service</span>{' '}
                      and{' '}
                      <span className="text-[#0d47a1] dark:text-[#7986CB] font-medium">Privacy Policy</span>{' '}
                      of RailOpt AI, Ministry of Railways
                    </Label>
                  </div>

                  {/* Submit button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#1a237e] to-[#0d47a1] hover:from-[#283593] hover:to-[#1565C0] text-white text-sm h-10 shadow-md shadow-[#1a237e]/20"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                        Create Account
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
                  After registration, your account will be reviewed by an administrator before activation.
                  For immediate access, use one of the demo accounts on the Sign In tab.
                </p>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground mt-4">
          RailOpt AI · SIH 2025 · Ministry of Railways, Govt of India
        </p>
      </div>
    </div>
  )
}
