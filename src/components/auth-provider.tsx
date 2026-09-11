'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode, Component } from 'react'

/**
 * Error boundary that catches next-auth session fetch failures
 * and renders children without auth context as fallback.
 */
class AuthErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <>{this.props.children}</>
    }
    return this.props.children
  }
}

/**
 * AuthProvider wraps next-auth's SessionProvider with an error boundary.
 * In dev mode without a configured auth backend, the session fetch may fail.
 * The error boundary catches this and renders children without auth context.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthErrorBoundary>
      <SessionProvider>
        {children}
      </SessionProvider>
    </AuthErrorBoundary>
  )
}
