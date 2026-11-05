import React, { createContext, useContext, useState, useEffect } from 'react'
import { tenantAPI } from '../services/api'

const ThemeContext = createContext()

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function ThemeProvider(props) {
  const children = props.children

  function getInitialTheme() {
    const saved = localStorage.getItem('theme')
    if (saved) {
      return saved === 'dark'
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  const [isDark, setIsDark] = useState(getInitialTheme)
  const [tenantBranding, setTenantBranding] = useState(null)

  useEffect(() => {
    // Update document class and localStorage
    if (isDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  // Fetch active tenant branding & inject dynamic CSS variables
  useEffect(() => {
    let subdomain = localStorage.getItem('mockTenant')
    if (!subdomain && typeof window !== 'undefined' && window.location.hostname) {
      const isIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(window.location.hostname)
      if (!isIP && window.location.hostname !== 'localhost') {
        const parts = window.location.hostname.split('.')
        if (parts.length >= 3 && parts[0] !== 'www') {
          subdomain = parts[0]
        }
      }
    }

    if (subdomain && subdomain !== 'default') {
      tenantAPI
        .getPublic(subdomain)
        .then((res) => {
          const tenant = res.data.data
          if (tenant && tenant.settings) {
            setTenantBranding(tenant)
            const primary = tenant.settings.primaryColor || '#c3a372'
            const secondary = tenant.settings.secondaryColor || '#1a1918'
            document.documentElement.style.setProperty('--tenant-primary', primary)
            document.documentElement.style.setProperty('--tenant-secondary', secondary)
          }
        })
        .catch(() => {
          // Fallback to default
        })
    } else {
      document.documentElement.style.setProperty('--tenant-primary', '#c3a372')
      document.documentElement.style.setProperty('--tenant-secondary', '#1a1918')
    }
  }, [])

  function toggleTheme() {
    setIsDark(function (prev) {
      return !prev
    })
  }

  const value = {
    isDark,
    toggleTheme,
    theme: isDark ? 'dark' : 'light',
    tenantBranding,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
