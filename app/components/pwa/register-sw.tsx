'use client'

import { useEffect } from 'react'

export function RegisterSW() {
  useEffect(() => {
    // Avoid SW in development to prevent HMR/runtime mismatches
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    const controller = new AbortController()

    const register = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        // If there’s an updated service worker waiting, prompt it to activate
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        // Listen for updates and activate immediately on refresh-less deploys
        reg.addEventListener('updatefound', () => {
          const newSW = reg.installing
          if (!newSW) return
          newSW.addEventListener('statechange', () => {
            if (newSW.state === 'installed' && navigator.serviceWorker.controller) {
              newSW.postMessage({ type: 'SKIP_WAITING' })
            }
          })
        })
      } catch (e) {
        console.warn('SW register failed', e)
      }
    }

    register()
    return () => controller.abort()
  }, [])
  return null
}

export default RegisterSW
