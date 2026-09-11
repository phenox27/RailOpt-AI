'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LegalLinks } from './legal-dialog'
import {
  Clock,
  AlertTriangle,
  IndianRupee,
  Brain,
  ShieldCheck,
  Users,
  Wrench,
  BarChart3,
  CheckCircle2,
  Database,
  Cpu,
  Wifi,
  Lock,
  WifiOff,
  Accessibility,
  ArrowRight,
  ChevronRight,
  Zap,
  Layers,
  Route,
  Gauge,
  Globe,
  MapPin,
  Cable,
  Activity,
  Menu,
  X,
  LogIn,
  UserPlus,
} from 'lucide-react'

/* ─── Constants ─── */
const SAFFRON = '#FF9933'
const INDIAN_GREEN = '#138808'
const NAVY = '#1a237e'
const INDIGO = '#0d47a1'

/* ─── Animated Counter Component ─── */
function AnimatedCounter({
  end,
  duration = 2000,
  className = '',
  prefix = '',
  suffix = '',
  displayOverride,
}: {
  end: number
  duration?: number
  className?: string
  prefix?: string
  suffix?: string
  displayOverride?: string
}) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const shouldReduce = useReducedMotion()
  const hasStarted = useRef(false)

  useEffect(() => {
    if (!isInView || hasStarted.current) return
    hasStarted.current = true

    let rafId: number
    if (shouldReduce) {
      rafId = requestAnimationFrame(() => setCount(end))
    } else {
      let startTime: number | null = null
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setCount(Math.floor(eased * end))
        if (progress < 1) {
          rafId = requestAnimationFrame(step)
        }
      }
      rafId = requestAnimationFrame(step)
    }
    return () => cancelAnimationFrame(rafId)
  }, [isInView, end, duration, shouldReduce])

  return (
    <div ref={ref} className={className}>
      {prefix}
      {displayOverride ? displayOverride : count.toLocaleString('en-IN')}
      {suffix}
    </div>
  )
}

/* ─── Tricolor Strip ─── */
function TricolorStrip({ className = '' }: { className?: string }) {
  return (
    <div className={`flex h-1 w-full ${className}`} aria-hidden="true">
      <div className="flex-1" style={{ backgroundColor: SAFFRON }} />
      <div className="flex-1 bg-white" />
      <div className="flex-1" style={{ backgroundColor: INDIAN_GREEN }} />
    </div>
  )
}

/* ─── Ashoka Chakra Inspired Pattern ─── */
function ChakraPattern() {
  const spokes = 24
  return (
    <div className="absolute right-8 top-1/2 -translate-y-1/2 w-64 h-64 opacity-[0.06] pointer-events-none hidden lg:block" aria-hidden="true">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <circle cx="100" cy="100" r="95" fill="none" stroke="white" strokeWidth="1.5" />
        <circle cx="100" cy="100" r="75" fill="none" stroke="white" strokeWidth="0.5" />
        <circle cx="100" cy="100" r="20" fill="none" stroke="white" strokeWidth="1" />
        {Array.from({ length: spokes }).map((_, i) => {
          const angle = (i * 360) / spokes
          const rad = (angle * Math.PI) / 180
          const x1 = 100 + 20 * Math.cos(rad)
          const y1 = 100 + 20 * Math.sin(rad)
          const x2 = 100 + 95 * Math.cos(rad)
          const y2 = 100 + 95 * Math.sin(rad)
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="0.8" />
          )
        })}
      </svg>
    </div>
  )
}

/* ─── Railway Track SVG ─── */
function RailwayTrack() {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20 pointer-events-none" aria-hidden="true">
      <svg viewBox="0 0 1200 100" preserveAspectRatio="none" className="w-full h-full">
        <line x1="0" y1="90" x2="600" y2="40" stroke="white" strokeWidth="2" />
        <line x1="1200" y1="90" x2="600" y2="40" stroke="white" strokeWidth="2" />
        {Array.from({ length: 20 }).map((_, i) => {
          const t = i / 19
          const y = 90 - t * 50
          const spread = 600 * (1 - t * 0.85)
          return (
            <line
              key={i}
              x1={600 - spread}
              y1={y}
              x2={600 + spread}
              y2={y}
              stroke="white"
              strokeWidth="1.5"
              opacity={1 - t * 0.6}
            />
          )
        })}
      </svg>
    </div>
  )
}

/* ─── Floating Particles ─── */
function FloatingParticles() {
  const shouldReduce = useReducedMotion()
  if (shouldReduce) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-white/20"
          style={{
            left: `${((i * 37 + 13) % 100)}%`,
            top: `${((i * 53 + 7) % 100)}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 3 + (i % 5),
            repeat: Infinity,
            delay: (i % 4) * 0.7,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

/* ─── Dot Grid Pattern ─── */
function DotGrid() {
  return (
    <div
      className="absolute inset-0 opacity-[0.04] pointer-events-none"
      aria-hidden="true"
      style={{
        backgroundImage: 'radial-gradient(circle, #1a237e 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    />
  )
}

/* ─── Section Wrapper ─── */
function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={`relative py-16 md:py-24 scroll-mt-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  )
}

/* ─── Section Title ─── */
function SectionTitle({
  en,
  hi,
  light = false,
}: {
  en: string
  hi: string
  light?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="text-center mb-12 md:mb-16"
    >
      <h2
        className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-2 ${
          light ? 'text-white' : 'text-[#1a237e]'
        }`}
      >
        {en}
      </h2>
      <p className={`text-lg md:text-xl ${light ? 'text-white/70' : 'text-gray-500'}`}>
        {hi}
      </p>
    </motion.div>
  )
}

/* ─── Shimmer Button ─── */
function ShimmerButton({
  children,
  className = '',
  onClick,
  variant = 'primary',
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  variant?: 'primary' | 'outline'
}) {
  const shouldReduce = useReducedMotion()

  if (variant === 'outline') {
    return (
      <motion.button
        whileHover={shouldReduce ? {} : { scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
        className={`relative overflow-hidden px-8 py-3 rounded-lg border-2 border-white text-white font-semibold text-lg transition-colors hover:bg-white/10 ${className}`}
      >
        {children}
      </motion.button>
    )
  }

  return (
    <motion.button
      whileHover={shouldReduce ? {} : { scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative overflow-hidden px-8 py-3 rounded-lg font-semibold text-lg text-white ${className}`}
      style={{ backgroundColor: NAVY }}
    >
      {!shouldReduce && (
        <motion.div
          className="absolute inset-0 -translate-x-full"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1, ease: 'easeInOut' }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}

/* ─── Animated Text Reveal ─── */
function AnimatedTitle({ text, className = '' }: { text: string; className?: string }) {
  const shouldReduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true })

  if (shouldReduce) {
    return <div ref={ref} className={className}>{text}</div>
  }

  return (
    <div ref={ref} className={className} aria-label={text}>
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: i * 0.05, ease: 'easeOut' }}
          className="inline-block"
          aria-hidden="true"
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   STICKY NAVIGATION BAR
   ═══════════════════════════════════════════════════════ */
function StickyNavBar({ onEnterApp, onSignUp }: { onEnterApp: () => void; onSignUp: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const shouldReduce = useReducedMotion()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const navLinks = [
    { label: 'Features', href: '#solution' },
    { label: 'Impact', href: '#impact' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Coverage', href: '#coverage' },
  ]

  return (
    <>
      {/* Tricolor strip at very top */}
      <div className="fixed top-0 left-0 right-0 z-[60] flex h-[3px] w-full" aria-hidden="true">
        <div className="flex-1" style={{ backgroundColor: SAFFRON }} />
        <div className="flex-1 bg-white" />
        <div className="flex-1" style={{ backgroundColor: INDIAN_GREEN }} />
      </div>

      {/* Main nav bar */}
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-[3px] left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#1a237e]/95 backdrop-blur-md shadow-lg'
            : 'bg-transparent backdrop-blur-none'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo + Name */}
            <a href="#" className="flex items-center gap-2.5 shrink-0" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
              <Image
                src="/logo-icon.png"
                alt="RailOpt AI"
                width={36}
                height={36}
                className="rounded-lg bg-white/95 object-contain p-0.5"
                style={{ width: 36, height: 36 }}
              />
              <span className={`font-bold text-lg tracking-tight transition-colors duration-300 ${scrolled ? 'text-white' : 'text-white'}`}>
                RailOpt AI
              </span>
            </a>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-colors duration-200 hover:text-[#FF9933] ${
                    scrolled ? 'text-white/80' : 'text-white/80'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <motion.button
                whileHover={shouldReduce ? {} : { scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onEnterApp}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all duration-200 ${
                  scrolled
                    ? 'border-white/40 text-white hover:bg-white/10 hover:border-white/60'
                    : 'border-white/40 text-white hover:bg-white/10 hover:border-white/60'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <LogIn className="w-4 h-4" /> Login
                </span>
              </motion.button>
              <motion.button
                whileHover={shouldReduce ? {} : { scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={onSignUp}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:brightness-110"
                style={{ backgroundColor: SAFFRON }}
              >
                <span className="flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4" /> Register
                </span>
              </motion.button>
            </div>

            {/* Mobile Hamburger */}
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed inset-0 z-[55] md:hidden"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            {/* Slide-in panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-[#0d1030] shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile menu header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <span className="text-white font-bold text-lg">RailOpt AI</span>
                <button onClick={() => setMobileOpen(false)} className="p-1 text-white/60 hover:text-white" aria-label="Close menu">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile nav links */}
              <div className="flex-1 py-4 px-4 space-y-1">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-3 px-3 rounded-lg text-white/80 hover:text-white hover:bg-white/10 font-medium transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Mobile auth buttons */}
              <div className="p-4 border-t border-white/10 space-y-3">
                <button
                  onClick={() => { setMobileOpen(false); onEnterApp() }}
                  className="w-full py-3 rounded-lg border-2 border-white/40 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                >
                  <LogIn className="w-4 h-4" /> Login
                </button>
                <button
                  onClick={() => { setMobileOpen(false); onSignUp() }}
                  className="w-full py-3 rounded-lg text-white font-semibold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                  style={{ backgroundColor: SAFFRON }}
                >
                  <UserPlus className="w-4 h-4" /> Register
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 1: Hero
   ═══════════════════════════════════════════════════════ */
function HeroSection({ onEnterApp, onSignUp }: { onEnterApp: () => void; onSignUp: () => void }) {
  const shouldReduce = useReducedMotion()

  const stats = [
    { value: '12,000+', label: 'km Network', icon: Route },
    { value: '7,000+', label: 'Stations', icon: MapPin },
    { value: '2.5 Cr+', label: 'Daily Passengers', icon: Users },
  ]

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, ${INDIGO} 50%, #0a0a2e 100%)`,
        }}
        animate={
          shouldReduce
            ? {}
            : {
                background: [
                  `linear-gradient(135deg, ${NAVY} 0%, ${INDIGO} 50%, #0a0a2e 100%)`,
                  `linear-gradient(135deg, ${INDIGO} 0%, #0a0a2e 50%, ${NAVY} 100%)`,
                  `linear-gradient(135deg, #0a0a2e 0%, ${NAVY} 50%, ${INDIGO} 100%)`,
                  `linear-gradient(135deg, ${NAVY} 0%, ${INDIGO} 50%, #0a0a2e 100%)`,
                ],
              }
        }
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
      />

      <FloatingParticles />
      <ChakraPattern />
      <RailwayTrack />

      {/* Tricolor strip at top */}
      <TricolorStrip className="relative z-10" />

      {/* Government Header */}
      <div className="relative z-10 text-center py-3 md:py-4">
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-white/80 text-xs md:text-sm tracking-widest uppercase"
        >
          Government of India / भारत सरकार
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white/60 text-xs tracking-wider uppercase mt-0.5"
        >
          Ministry of Railways / रेल मंत्रालय
        </motion.p>
      </div>

      {/* Main Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-6"
        >
          <Image
            src="/logo-icon.png"
            alt="RailOpt AI Logo"
            width={80}
            height={80}
            className="rounded-xl bg-white/95 object-contain p-1 shadow-lg shadow-black/30"
            style={{ width: 80, height: 80 }}
            priority
          />
        </motion.div>

        {/* Title */}
        <AnimatedTitle
          text="RailOpt AI"
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight mb-4"
        />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-lg md:text-xl lg:text-2xl text-white/80 max-w-3xl mb-8 leading-relaxed"
        >
          AI-Powered Block Planning &amp; Optimization for Indian Railways
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="flex flex-col sm:flex-row gap-4 mb-12"
        >
          <ShimmerButton onClick={onEnterApp} className="shadow-lg shadow-[#1a237e]/40">
            <span className="flex items-center gap-2">
              <LogIn className="w-5 h-5" /> Login to Dashboard <ArrowRight className="w-5 h-5" />
            </span>
          </ShimmerButton>
          <ShimmerButton variant="outline" onClick={onSignUp}>
            <span className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" /> Register Now
            </span>
          </ShimmerButton>
        </motion.div>

        {/* Floating Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="flex flex-col sm:flex-row gap-4 sm:gap-8"
        >
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 1.4 + i * 0.15 }}
                className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10"
              >
                <Icon className="w-5 h-5 text-[#FF9933]" />
                <div className="text-left">
                  <p className="text-white font-bold text-lg">{stat.value}</p>
                  <p className="text-white/60 text-xs">{stat.label}</p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="relative z-10 flex justify-center pb-8"
      >
        <motion.div
          animate={shouldReduce ? {} : { y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center pt-2"
        >
          <div className="w-1 h-2 rounded-full bg-white/50" />
        </motion.div>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 2: Problem Statement
   ═══════════════════════════════════════════════════════ */

/* Individual pain point card — must be its own component for hooks */
function PainPointCard({
  icon: Icon,
  title,
  description,
  stat,
  suffix,
  color,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  stat: number
  suffix: string
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
    >
      <Card className="h-full border-t-4 hover:shadow-xl transition-shadow duration-300" style={{ borderTopColor: color }}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}15` }}>
              <Icon className="w-6 h-6" style={{ color }} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <div className="mb-4">
            <AnimatedCounter
              end={stat}
              suffix={suffix}
              className="text-4xl font-extrabold"
            />
          </div>
          <p className="text-gray-600 leading-relaxed">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ProblemSection() {
  const painPoints = [
    {
      icon: Clock,
      title: 'Manual Block Planning',
      description:
        'Manual block planning takes 4-6 hours per corridor, relying on paper-based processes and phone coordination across departments.',
      stat: 6,
      suffix: ' hrs',
      color: SAFFRON,
    },
    {
      icon: AlertTriangle,
      title: 'Underutilized Windows',
      description:
        '23% of maintenance windows go underutilized due to poor coordination, leading to asset degradation and safety risks.',
      stat: 23,
      suffix: '%',
      color: '#dc2626',
    },
    {
      icon: IndianRupee,
      title: 'Annual Delay Cost',
      description:
        'Train delays cost Indian Railways ₹18,000 Cr annually — a staggering economic impact from suboptimal scheduling.',
      stat: 18000,
      suffix: ' Cr',
      color: NAVY,
    },
  ]

  return (
    <Section id="problem" className="bg-white">
      <DotGrid />
      <SectionTitle en="The Challenge" hi="चुनौती" />

      <div className="grid md:grid-cols-3 gap-6 lg:gap-8 relative">
        {painPoints.map((point, i) => (
          <PainPointCard
            key={point.title}
            icon={point.icon}
            title={point.title}
            description={point.description}
            stat={point.stat}
            suffix={point.suffix}
            color={point.color}
            delay={i * 0.15}
          />
        ))}
      </div>
    </Section>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 3: Solution
   ═══════════════════════════════════════════════════════ */
function SolutionSection() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Driven Block Optimization',
      desc: 'Reduces planning time by 85% using constraint-satisfaction and genetic algorithms.',
      badge: '85% faster',
    },
    {
      icon: ShieldCheck,
      title: 'Real-time Conflict Detection',
      desc: 'Instant alerts for overlapping blocks, resource conflicts, and safety violations.',
      badge: 'Instant',
    },
    {
      icon: Users,
      title: 'Multi-Department Collaboration',
      desc: 'Unified workspace for Engineering, S&T, Traction, Operations, Mechanical, and Commercial.',
      badge: '6 departments',
    },
    {
      icon: Wrench,
      title: 'Predictive Maintenance Scheduling',
      desc: 'ML-based forecasting of asset health to proactively schedule maintenance windows.',
      badge: 'Predictive',
    },
    {
      icon: BarChart3,
      title: 'Asset Utilization Tracking',
      desc: 'Real-time dashboards tracking track, signal, and rolling stock availability at 87%+.',
      badge: '87%+ avail',
    },
    {
      icon: CheckCircle2,
      title: 'Automated Approval Workflows',
      desc: 'Multi-level digital approval chain replacing physical signature routing across zones.',
      badge: 'Automated',
    },
  ]

  return (
    <Section id="solution" className="bg-gray-50">
      <SectionTitle en="The RailOpt AI Solution" hi="समाधान" />

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {/* Feature List */}
        <div className="space-y-4">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 hover:border-[#1a237e]/30">
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-[#1a237e]/10 shrink-0">
                      <Icon className="w-5 h-5 text-[#1a237e]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-gray-900">{feature.title}</h3>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-[#FF9933]/10 text-[#c27300] border-[#FF9933]/20"
                        >
                          {feature.badge}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Animated Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7 }}
          className="sticky top-24"
        >
          <Card className="overflow-hidden shadow-2xl border-0">
            {/* Mockup Top Bar */}
            <div className="h-10 flex items-center gap-2 px-4" style={{ backgroundColor: NAVY }}>
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-white/60 text-xs ml-2">RailOpt AI Dashboard</span>
            </div>
            {/* Mockup Content */}
            <div className="p-4 bg-gray-50 space-y-3">
              {/* Mock KPI Row */}
              <div className="grid grid-cols-3 gap-2">
                {['Blocks Optimized', 'Conflicts Resolved', 'Uptime'].map((label, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="bg-white rounded-lg p-3 shadow-sm"
                  >
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-lg font-bold text-[#1a237e]">
                      {['247', '12', '99.7%'][i]}
                    </p>
                  </motion.div>
                ))}
              </div>
              {/* Mock Timeline */}
              <div className="bg-white rounded-lg p-3 shadow-sm">
                <p className="text-xs text-gray-500 mb-2">Block Timeline — Delhi Division</p>
                <div className="space-y-1.5">
                  {['06:00-09:00', '09:30-12:00', '13:00-16:30', '17:00-20:00'].map(
                    (slot, i) => (
                      <div key={slot} className="flex items-center gap-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${65 + i * 8}%`,
                            backgroundColor:
                              i === 0
                                ? SAFFRON
                                : i === 1
                                  ? INDIAN_GREEN
                                  : i === 2
                                    ? NAVY
                                    : INDIGO,
                          }}
                        />
                        <span className="text-xs text-gray-400">{slot}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>
              {/* Mock Status */}
              <div className="flex gap-2">
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <Activity className="w-3 h-3 mr-1" /> Live
                </Badge>
                <Badge variant="outline" className="text-gray-500">
                  Zone: NR
                </Badge>
                <Badge variant="outline" className="text-gray-500">
                  Div: Delhi
                </Badge>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </Section>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 4: Impact / Statistics
   ═══════════════════════════════════════════════════════ */

/* Individual impact card — own component for hooks */
function ImpactCard({
  icon: Icon,
  value,
  prefix,
  suffix,
  label,
  displayOverride,
  delay,
}: {
  icon: React.ComponentType<{ className?: string }>
  value: number
  prefix?: string
  suffix?: string
  label: string
  displayOverride?: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay }}
      className="text-center"
    >
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10 hover:bg-white/15 transition-colors">
        <Icon className="w-7 h-7 text-[#FF9933] mx-auto mb-3" />
        <AnimatedCounter
          end={value}
          prefix={prefix}
          suffix={suffix}
          displayOverride={displayOverride}
          className="text-3xl md:text-4xl font-extrabold text-white mb-1"
          duration={2500}
        />
        <p className="text-white/60 text-sm">{label}</p>
      </div>
    </motion.div>
  )
}

function ImpactSection() {
  const impacts = [
    { value: 85, suffix: '%', label: 'Reduction in Planning Time', icon: Clock },
    { value: 2400, prefix: '₹', suffix: ' Cr', label: 'Potential Annual Savings', icon: IndianRupee },
    { value: 12, suffix: '', label: 'Zones Covered', icon: Layers },
    { value: 18, suffix: '', label: 'Corridors Optimized', icon: Route },
    { value: 997, suffix: '', label: 'System Uptime', displayOverride: '99.7%', icon: Gauge },
  ]

  return (
    <section id="impact" className="relative py-16 md:py-24 overflow-hidden scroll-mt-20" style={{ background: `linear-gradient(135deg, ${NAVY}, ${INDIGO}, #0a0a2e)` }}>
      <FloatingParticles />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        <SectionTitle en="Impact at Scale" hi="प्रभाव" light />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {impacts.map((item, i) => (
            <ImpactCard
              key={item.label}
              icon={item.icon}
              value={item.value}
              prefix={item.prefix}
              suffix={item.suffix}
              label={item.label}
              displayOverride={item.displayOverride}
              delay={i * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 5: How It Works
   ═══════════════════════════════════════════════════════ */
function HowItWorksSection() {
  const steps = [
    {
      num: 1,
      icon: Database,
      title: 'Data Collection',
      desc: 'Real-time data from CRIS, FOIS, COA and other railway systems feeds into the platform.',
      color: SAFFRON,
    },
    {
      num: 2,
      icon: Cpu,
      title: 'AI Analysis',
      desc: 'ML models analyze constraints, resource availability, and detect potential conflicts.',
      color: NAVY,
    },
    {
      num: 3,
      icon: Zap,
      title: 'Optimization',
      desc: 'Genetic algorithm with constraint satisfaction finds the optimal block plan in minutes.',
      color: INDIAN_GREEN,
    },
    {
      num: 4,
      icon: CheckCircle2,
      title: 'Deployment',
      desc: 'Optimized plan deployed through automated multi-level approval workflow to all departments.',
      color: INDIGO,
    },
  ]

  return (
    <Section id="how-it-works" className="bg-white">
      <SectionTitle en="How It Works" hi="कैसे काम करता है" />

      <div className="relative">
        {/* Connecting line */}
        <div className="hidden md:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-gray-200" aria-hidden="true">
          <motion.div
            className="h-full bg-gradient-to-r from-[#FF9933] via-[#1a237e] to-[#138808]"
            initial={{ width: '0%' }}
            whileInView={{ width: '100%' }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                className="text-center relative"
              >
                <div className="flex justify-center mb-6">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: step.color }}
                  >
                    <Icon className="w-7 h-7 text-white" />
                    <span
                      className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-bold"
                      style={{ color: step.color }}
                    >
                      {step.num}
                    </span>
                  </motion.div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 6: Technology Stack
   ═══════════════════════════════════════════════════════ */
function TechStackSection() {
  const techs = [
    { icon: Globe, title: 'Next.js 16', desc: 'Modern SSR frontend with App Router', color: NAVY },
    { icon: Brain, title: 'AI/ML Engine', desc: 'Optimization & conflict detection', color: SAFFRON },
    { icon: Wifi, title: 'Real-time Sync', desc: 'WebSocket-based live updates', color: INDIAN_GREEN },
    { icon: Lock, title: 'Role-Based Access', desc: '6 distinct department roles', color: INDIGO },
    { icon: WifiOff, title: 'Offline Support', desc: 'PWA with service worker cache', color: '#6b21a8' },
    { icon: Accessibility, title: 'WCAG 2.2 AA', desc: 'Fully accessible interface', color: '#b91c1c' },
  ]

  return (
    <Section id="tech" className="bg-gray-50">
      <SectionTitle en="Powered By" hi="प्रौद्योगिकी" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
        {techs.map((tech, i) => {
          const Icon = tech.icon
          return (
            <motion.div
              key={tech.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
            >
              <Card className="h-full text-center hover:shadow-lg transition-shadow duration-300 border-t-2" style={{ borderTopColor: tech.color }}>
                <CardContent className="p-5">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${tech.color}12` }}>
                    <Icon className="w-6 h-6" style={{ color: tech.color }} />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1">{tech.title}</h3>
                  <p className="text-sm text-gray-500">{tech.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 7: Zones & Corridors
   ═══════════════════════════════════════════════════════ */
function ZonesSection() {
  const zones = [
    { code: 'NR', name: 'Northern', color: SAFFRON },
    { code: 'NER', name: 'North Eastern', color: '#b91c1c' },
    { code: 'NCR', name: 'North Central', color: NAVY },
    { code: 'ER', name: 'Eastern', color: INDIAN_GREEN },
    { code: 'SER', name: 'South Eastern', color: INDIGO },
    { code: 'SCR', name: 'South Central', color: '#6b21a8' },
    { code: 'CR', name: 'Central', color: SAFFRON },
    { code: 'WR', name: 'Western', color: '#0369a1' },
    { code: 'SR', name: 'Southern', color: INDIAN_GREEN },
    { code: 'SWR', name: 'South Western', color: '#b91c1c' },
    { code: 'NFR', name: 'North Frontier', color: NAVY },
    { code: 'SECR', name: 'South East Central', color: INDIGO },
  ]

  const corridors = [
    'Delhi–Howrah (Grand Chord)',
    'Delhi–Mumbai (Western DFC)',
    'Delhi–Chennai (Grand Trunk)',
    'Howrah–Mumbai (via Nagpur)',
    'Mumbai–Chennai (via Bangalore)',
    'Delhi–Guwahati (NE Frontier)',
  ]

  return (
    <Section id="coverage" className="bg-white">
      <SectionTitle en="Coverage" hi="कवरेज" />

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Zones */}
        <div>
          <h3 className="text-xl font-bold text-[#1a237e] mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5" /> Railway Zones
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {zones.map((zone, i) => (
              <motion.div
                key={zone.code}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                whileHover={{ scale: 1.05, transition: { duration: 0.15 } }}
              >
                <Card className="cursor-default hover:shadow-md transition-shadow">
                  <CardContent className="p-3 text-center">
                    <span
                      className="inline-block text-lg font-extrabold mb-0.5"
                      style={{ color: zone.color }}
                    >
                      {zone.code}
                    </span>
                    <p className="text-xs text-gray-500 leading-tight">{zone.name}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Corridors */}
        <div>
          <h3 className="text-xl font-bold text-[#1a237e] mb-4 flex items-center gap-2">
            <Cable className="w-5 h-5" /> Key Corridors
          </h3>
          <div className="space-y-3">
            {corridors.map((corridor, i) => (
              <motion.div
                key={corridor}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: i % 2 === 0 ? NAVY : INDIAN_GREEN }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{corridor}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 8: CTA
   ═══════════════════════════════════════════════════════ */
function CTASection({ onEnterApp, onSignUp }: { onEnterApp: () => void; onSignUp: () => void }) {
  return (
    <section
      id="cta"
      className="relative py-20 md:py-28 overflow-hidden scroll-mt-20"
      style={{
        background: `linear-gradient(135deg, ${SAFFRON}22, white, ${INDIAN_GREEN}22)`,
      }}
    >
      {/* Tricolor gradient bar top */}
      <TricolorStrip className="absolute top-0 left-0 right-0" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1a237e] mb-3">
            Ready to Optimize?
          </h2>
          <p className="text-lg text-gray-500 mb-2">अनुकूलन शुरू करें</p>
          <p className="text-sm text-gray-400 mb-8 max-w-xl mx-auto">
            Authorized personnel only — Ministry of Railways, Government of India
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <ShimmerButton onClick={onEnterApp} className="px-10 py-4 text-xl shadow-xl shadow-[#1a237e]/30">
              <span className="flex items-center gap-3">
                <LogIn className="w-6 h-6" />
                Login to Dashboard
                <ArrowRight className="w-6 h-6" />
              </span>
            </ShimmerButton>
            <ShimmerButton variant="outline" onClick={onSignUp} className="px-10 py-4 text-xl">
              <span className="flex items-center gap-3">
                <UserPlus className="w-6 h-6" />
                Register Now
              </span>
            </ShimmerButton>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION 9: Footer
   ═══════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="bg-[#0a0a1a] text-white/70 print:hidden">
      <TricolorStrip />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Government Info */}
          <div>
            <p className="text-white font-semibold mb-1">Government of India</p>
            <p className="text-sm">भारत सरकार</p>
            <p className="text-sm mt-2">Ministry of Railways / रेल मंत्रालय</p>
            <p className="text-sm text-white/50 mt-1">Rail Bhawan, New Delhi — 110001</p>
          </div>

          {/* Credits */}
          <div>
            <p className="text-white font-semibold mb-1">Technical Partner</p>
            <p className="text-sm">CRIS — Centre for Railway Information Systems</p>
            <p className="text-sm text-white/50 mt-1">Designed &amp; Developed by NIC / CRIS</p>
          </div>

          {/* Legal Links */}
          <div>
            <p className="text-white font-semibold mb-2">Legal</p>
            <LegalLinks
              className="flex flex-wrap gap-x-4 gap-y-1 [&>span]:contents [&_button]:text-sm [&_button]:hover:text-white [&_button]:transition-colors [&_button]:underline-offset-4 [&_button]:hover:underline [&_.text-border]:hidden"
              separatorClassName="hidden"
            />
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/40">
            © {new Date().getFullYear()} Ministry of Railways, Government of India. All rights reserved.
          </p>
          <p className="text-sm text-white/40">
            Made with ❤️ for Indian Railways
          </p>
        </div>
      </div>

      <TricolorStrip />
    </footer>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */
export function LandingPage({ onEnterApp, onSignUp }: { onEnterApp: () => void; onSignUp: () => void }) {
  return (
    <div className="min-h-screen flex flex-col">
      <StickyNavBar onEnterApp={onEnterApp} onSignUp={onSignUp} />
      <main className="flex-1">
        <HeroSection onEnterApp={onEnterApp} onSignUp={onSignUp} />
        <ProblemSection />
        <SolutionSection />
        <ImpactSection />
        <HowItWorksSection />
        <TechStackSection />
        <ZonesSection />
        <CTASection onEnterApp={onEnterApp} onSignUp={onSignUp} />
      </main>
      <Footer />
    </div>
  )
}
