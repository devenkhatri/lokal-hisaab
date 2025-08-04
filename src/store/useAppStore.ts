import { create } from 'zustand'
import { Account, Location, Transaction } from '@/lib/supabase'

interface AppState {
  // Auth state
  isAuthenticated: boolean
  setAuthenticated: (value: boolean) => void
  
  // Selected location for filtering
  selectedLocationId: string | null
  setSelectedLocationId: (id: string | null) => void
  
  // Data
  locations: Location[]
  accounts: Account[]
  transactions: Transaction[]
  
  // Actions
  setLocations: (locations: Location[]) => void
  setAccounts: (accounts: Account[]) => void
  setTransactions: (transactions: Transaction[]) => void
  
  // Computed values
  getLocationName: (id: string) => string
  getAccountName: (id: string) => string
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  isAuthenticated: false,
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  
  // Location filter
  selectedLocationId: null,
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
  
  // Data
  locations: [],
  accounts: [],
  transactions: [],
  
  // Actions
  setLocations: (locations) => set({ locations }),
  setAccounts: (accounts) => set({ accounts }),
  setTransactions: (transactions) => set({ transactions }),
  
  // Computed values
  getLocationName: (id) => {
    const location = get().locations.find(l => l.id === id)
    return location?.name || 'Unknown Location'
  },
  
  getAccountName: (id) => {
    const account = get().accounts.find(a => a.id === id)
    return account?.name || 'Unknown Account'
  }
}))