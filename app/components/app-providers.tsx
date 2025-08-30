"use client";
import React from 'react'
import { ThemeProvider } from '@/components/theme-provider'
import { I18nProvider } from '@/lib/i18n'
import { RegisterSW } from '@/components/pwa/register-sw'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        <RegisterSW />
        {children}
      </I18nProvider>
    </ThemeProvider>
  )
}
