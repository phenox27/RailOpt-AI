'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

/**
 * Government of India header banner with tricolor strip,
 * national emblem logo, and bilingual Hindi/English branding.
 * Styled per Indian Government portal standards (NIC guidelines).
 */
export function GovernmentHeader() {
  return (
    <div className="w-full shrink-0 government-print-header">
      {/* Tricolor strip - saffron / white / green */}
      <div className="flex h-[3px] w-full" aria-hidden="true">
        <div className="flex-1 bg-[#FF9933]" /> {/* Saffron */}
        <div className="flex-1 bg-white" />     {/* White */}
        <div className="flex-1 bg-[#138808]" /> {/* Green */}
      </div>

      {/* Main government header bar */}
      <div className="relative bg-gradient-to-r from-[#1a237e] via-[#0d47a1] to-[#1a237e] text-white overflow-hidden">
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />

        <div className="relative flex items-center justify-between px-3 sm:px-5 py-1.5 sm:py-2">
          {/* Left: National emblem + Ministry text */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* National emblem / Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative shrink-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden backdrop-blur-sm">
                <Image
                  src="/logo-icon.png"
                  alt="RailOpt AI emblem"
                  width={36}
                  height={36}
                  className="object-contain"
                  style={{ width: 36, height: 36 }}
                  priority
                />
              </div>
            </motion.div>

            {/* Ministry / Department text */}
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] sm:text-[10px] leading-tight text-white/70 font-medium tracking-wide truncate">
                भारत सरकार / Government of India
              </span>
              <span className="text-[10px] sm:text-xs leading-tight text-white/90 font-semibold truncate">
                रेल मंत्रालय / Ministry of Railways
              </span>
              <span className="text-[8px] sm:text-[10px] leading-tight text-white/60 font-normal truncate hidden sm:block">
                रेलवे बोर्ड / Railway Board
              </span>
            </div>
          </div>

          {/* Center: App branding (hidden on small screens) */}
          <div className="hidden md:flex flex-col items-center mx-4">
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center gap-2"
            >
              {/* Ashoka Chakra inspired ring */}
              <div className="relative w-6 h-6">
                <div className="absolute inset-0 rounded-full border-2 border-white/30" />
                <div className="absolute inset-1 rounded-full border border-dashed border-white/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#000080]" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold tracking-wider text-white">
                  RailOpt AI
                </span>
                <span className="text-[8px] text-white/50 tracking-widest uppercase">
                  ब्लॉक योजना एवं अनुकूलन प्रणाली
                </span>
              </div>
            </motion.div>
          </div>

          {/* Right: System info / NIC credit */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[8px] sm:text-[9px] text-white/50 leading-tight">
                Designed & Developed by
              </span>
              <span className="text-[9px] sm:text-[10px] text-white/70 font-semibold leading-tight">
                NIC / CRIS
              </span>
            </div>
            {/* Version badge */}
            <div className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-[8px] text-white/60 font-mono">
              v2.1
            </div>
          </div>
        </div>

        {/* Bottom tricolor accent line */}
        <div className="flex h-[2px] w-full" aria-hidden="true">
          <div className="flex-1 bg-[#FF9933]/60" />
          <div className="flex-1 bg-white/40" />
          <div className="flex-1 bg-[#138808]/60" />
        </div>
      </div>
    </div>
  )
}
