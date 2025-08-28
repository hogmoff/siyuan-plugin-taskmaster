"use client";
import React from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { RegisterSW } from '@/components/pwa/register-sw'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <RegisterSW />
      {children}
    </ThemeProvider>
  )
}

