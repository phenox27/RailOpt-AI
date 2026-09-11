'use client'

import { useEffect, useRef } from 'react'
import { useAppStore, type DeepLinkType } from '@/store/app-store'

/**
 * Consume a one-shot deep link pushed by the command palette.
 *
 * The deep link lives in the store until consumed (so the target view can
 * mount after the link is pushed). Handling runs in a microtask (setTimeout 0)
 * which keeps setState out of the synchronous effect body, and the latest
 * handler is used via ref so consumers can pass inline closures.
 *
 * Returns the current deep link (rarely needed; mostly for debugging).
 */
export function useDeepLink(handler: (type: DeepLinkType, id: string) => void) {
  const deepLink = useAppStore((s) => s.deepLink)
  const clearDeepLink = useAppStore((s) => s.clearDeepLink)
  const handlerRef = useRef(handler)
  useEffect(() => {
    handlerRef.current = handler
  }, [handler])

  useEffect(() => {
    if (!deepLink) return
    const t = setTimeout(() => {
      handlerRef.current(deepLink.type, deepLink.id)
      clearDeepLink()
    }, 0)
    return () => clearTimeout(t)
  }, [deepLink, clearDeepLink])

  return deepLink
}
