'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Custom hook that animates a number from 0 to a target value
 * using requestAnimationFrame for smooth 60fps animation
 * with ease-out-cubic easing for natural feel.
 *
 * @param target - The target number to animate to
 * @param duration - Animation duration in ms (default 1200)
 * @param shouldAnimate - Whether to animate (default true). If false, returns target immediately.
 * @returns The current animated value
 */
export function useAnimatedCounter(
  target: number,
  duration: number = 1200,
  shouldAnimate: boolean = true
): number {
  const [currentValue, setCurrentValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const shouldAnimateRef = useRef(shouldAnimate)
  const targetRef = useRef(target)

  // Determine the number of decimal places from the target
  const decimalPlaces = (() => {
    const str = String(target)
    const dotIndex = str.indexOf('.')
    if (dotIndex === -1) return 0
    return str.length - dotIndex - 1
  })()

  // Ease-out-cubic: decelerates towards the end for a natural feel
  const easeOutCubic = (t: number): number => {
    return 1 - Math.pow(1 - t, 3)
  }

  // When shouldAnimate or target change, update refs and kick off animation
  useEffect(() => {
    shouldAnimateRef.current = shouldAnimate
    targetRef.current = target

    // If animation is disabled, schedule a microtask to set value (avoids sync setState in effect)
    if (!shouldAnimate) {
      const frame = requestAnimationFrame(() => {
        setCurrentValue(target)
      })
      return () => cancelAnimationFrame(frame)
    }

    // Reset animation state
    startTimeRef.current = null

    const animate = (timestamp: number) => {
      if (!shouldAnimateRef.current) return

      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp
      }

      const elapsed = timestamp - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)
      const easedProgress = easeOutCubic(progress)

      const currentTarget = targetRef.current
      const newValue = easedProgress * currentTarget

      // Round to preserve decimal places from target
      const roundedValue = decimalPlaces > 0
        ? Math.round(newValue * Math.pow(10, decimalPlaces)) / Math.pow(10, decimalPlaces)
        : Math.round(newValue)

      setCurrentValue(roundedValue)

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }

    // Start from 0 via RAF callback (avoids sync setState in effect)
    rafRef.current = requestAnimationFrame((ts) => {
      setCurrentValue(0)
      startTimeRef.current = null
      animate(ts)
    })

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [target, duration, shouldAnimate, decimalPlaces])

  return currentValue
}
