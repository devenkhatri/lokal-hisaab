import { createClient } from '@supabase/supabase-js'

// Fallback URLs for development when Supabase is not fully configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Types for our database entities
export interface Location {
  id: string
  name: string
  address?: string
  created_at: string
  updated_at: string
}

export interface Account {
  id: string
  name: string
  phone_number?: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  transaction_no: string
  date: string
  amount: number
  type: 'credit' | 'debit'
  account_id: string
  location_id: string
  description?: string
  created_at: string
  updated_at: string
  accounts?: Account
  locations?: Location
}

// Dummy authentication for now
export const dummyAuth = {
  login: async (username: string, password: string) => {
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('isAuthenticated', 'true')
      return { success: true }
    }
    return { success: false, error: 'Invalid credentials' }
  },
  logout: () => {
    localStorage.removeItem('isAuthenticated')
  },
  isAuthenticated: () => {
    return localStorage.getItem('isAuthenticated') === 'true'
  }
}