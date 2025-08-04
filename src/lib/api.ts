import { supabase } from './supabase'
import { Transaction, Account, Location } from './supabase'

// Transactions API
export const transactionsApi = {
  // Get all transactions with pagination and filters
  getAll: async (params?: {
    page?: number
    limit?: number
    location_id?: string
    account_id?: string
    type?: 'credit' | 'debit'
    date_from?: string
    date_to?: string
    search?: string
  }) => {
    let query = supabase
      .from('transactions')
      .select(`
        *,
        accounts(id, name, phone_number),
        locations(id, name, address)
      `)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })

    // Apply filters
    if (params?.location_id) {
      query = query.eq('location_id', params.location_id)
    }
    if (params?.account_id) {
      query = query.eq('account_id', params.account_id)
    }
    if (params?.type) {
      query = query.eq('type', params.type)
    }
    if (params?.date_from) {
      query = query.gte('date', params.date_from)
    }
    if (params?.date_to) {
      query = query.lte('date', params.date_to)
    }
    if (params?.search) {
      query = query.or(`transaction_no.ilike.%${params.search}%,description.ilike.%${params.search}%`)
    }

    // Apply pagination
    const limit = params?.limit || 20
    const page = params?.page || 1
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await query.range(from, to)
    
    if (error) throw error
    return { data: data || [], count: count || 0 }
  },

  // Get single transaction
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        accounts(id, name, phone_number),
        locations(id, name, address)
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create transaction
  create: async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transaction])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update transaction
  update: async (id: string, transaction: Partial<Transaction>) => {
    const { data, error } = await supabase
      .from('transactions')
      .update({ ...transaction, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete transaction
  delete: async (id: string) => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Get dashboard stats
  getDashboardStats: async (location_id?: string) => {
    let query = supabase.from('transactions').select('*')
    
    if (location_id) {
      query = query.eq('location_id', location_id)
    }

    const { data, error } = await query
    if (error) throw error

    const today = new Date().toISOString().split('T')[0]
    const todayTransactions = data?.filter(t => t.date === today) || []
    
    const todayCredits = todayTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const todayDebits = todayTransactions
      .filter(t => t.type === 'debit')  
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      todayCredits,
      todayDebits,
      netBalance: todayCredits - todayDebits,
      totalTransactions: data?.length || 0
    }
  }
}

// Accounts API
export const accountsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('name')

    if (error) throw error
    return data || []
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  create: async (account: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('accounts')
      .insert([account])
      .select()
      .single()

    if (error) throw error
    return data
  },

  update: async (id: string, account: Partial<Account>) => {
    const { data, error } = await supabase
      .from('accounts')
      .update({ ...account, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}

// Locations API
export const locationsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('name')

    if (error) throw error
    return data || []
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  create: async (location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('locations')
      .insert([location])
      .select()
      .single()

    if (error) throw error
    return data
  },

  update: async (id: string, location: Partial<Location>) => {
    const { data, error } = await supabase
      .from('locations')
      .update({ ...location, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}