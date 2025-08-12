import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Users,
  MapPin,
  Receipt,
  Calendar,
  CalendarIcon,
  Activity,
  Target
} from 'lucide-react'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/currency'
import { formatDate, getDateRange } from '@/lib/utils/date'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { transactionsApi, accountsApi, locationsApi } from '@/lib/api'




export default function Dashboard() {
  const { selectedLocationId, setSelectedLocationId } = useAppStore()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dashboardData, setDashboardData] = useState({
    selectedDateCredits: 0,
    selectedDateDebits: 0,
    netBalance: 0,
    selectedDateCommissions: 0,
    totalTransactions: 0,
    activeAccounts: 0,
    totalLocations: 0,
    monthlyTotal: 0,
    weeklyAverage: 0,
    transactionCount: 0,
    avgTransactionAmount: 0,
    topAccount: { name: '', amount: 0 },
    recentTransactions: [] as any[]
  })
  const [locations, setLocations] = useState<any[]>([])
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load locations data
        const [locationsData, accountsData] = await Promise.all([
          locationsApi.getAll(),
          accountsApi.getAll()
        ])
        
        // Get selected date transactions
        const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
        const { data: selectedDateTransactions } = await transactionsApi.getAll({
          location_id: selectedLocationId || undefined,
          date_from: selectedDateStr,
          date_to: selectedDateStr,
          limit: 1000
        })

        // Calculate selected date metrics
        const selectedDateCredits = selectedDateTransactions
          .filter(t => t.type === 'credit')
          .reduce((sum, t) => sum + Number(t.amount), 0)
        
        const selectedDateDebits = selectedDateTransactions
          .filter(t => t.type === 'debit')
          .reduce((sum, t) => sum + Number(t.amount), 0)
        
        const selectedDateCommissions = selectedDateTransactions
          .reduce((sum, t) => sum + Number(t.commission || 0), 0)

        // Get last 7 days for weekly average
        const sevenDaysAgo = new Date(selectedDate)
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
        
        const { data: weeklyTransactions } = await transactionsApi.getAll({
          location_id: selectedLocationId || undefined,
          date_from: sevenDaysAgo.toISOString().split('T')[0],
          date_to: selectedDateStr,
          limit: 1000
        })

        // Calculate weekly average
        const weeklyTotal = weeklyTransactions.reduce((sum, t) => {
          return sum + (t.type === 'credit' ? Number(t.amount) : -Number(t.amount))
        }, 0)
        const weeklyAverage = weeklyTotal / 7

        // Get monthly transactions for monthly total
        const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
        
        const { data: monthlyTransactions } = await transactionsApi.getAll({
          location_id: selectedLocationId || undefined,
          date_from: firstDayOfMonth.toISOString().split('T')[0],
          date_to: selectedDateStr,
          limit: 1000
        })

        const monthlyTotal = monthlyTransactions.reduce((sum, t) => {
          return sum + (t.type === 'credit' ? Number(t.amount) : -Number(t.amount))
        }, 0)

        // Calculate average transaction amount for selected date
        const avgTransactionAmount = selectedDateTransactions.length > 0 
          ? selectedDateTransactions.reduce((sum, t) => sum + Number(t.amount), 0) / selectedDateTransactions.length
          : 0

        // Find top account for selected date
        const accountSummary = selectedDateTransactions.reduce((acc: any, transaction) => {
          const accountName = transaction.accounts?.name || 'Unknown'
          if (!acc[accountName]) {
            acc[accountName] = 0
          }
          acc[accountName] += Number(transaction.amount)
          return acc
        }, {})

        const topAccountEntry = Object.entries(accountSummary)
          .sort(([,a], [,b]) => (b as number) - (a as number))[0]
        
        const topAccount = topAccountEntry 
          ? { name: topAccountEntry[0] as string, amount: topAccountEntry[1] as number }
          : { name: 'No transactions', amount: 0 }

        // Get recent transactions (last 5 for selected date)
        const recentTransactions = selectedDateTransactions
          .sort((a, b) => new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime())
          .slice(0, 5)

        // Count unique accounts that have transactions in the period
        const uniqueAccounts = new Set(weeklyTransactions.map(t => t.account_id))

        // Get total transactions count from API
        const stats = await transactionsApi.getDashboardStats(selectedLocationId || undefined)

        setLocations(locationsData)
        setDashboardData({
          selectedDateCredits,
          selectedDateDebits,
          netBalance: selectedDateCredits - selectedDateDebits,
          selectedDateCommissions,
          totalTransactions: stats.totalTransactions,
          activeAccounts: uniqueAccounts.size,
          totalLocations: locationsData.length,
          monthlyTotal,
          weeklyAverage,
          transactionCount: selectedDateTransactions.length,
          avgTransactionAmount,
          topAccount,
          recentTransactions
        })
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        // Fallback to empty state
        setDashboardData({
          selectedDateCredits: 0,
          selectedDateDebits: 0,
          netBalance: 0,
          selectedDateCommissions: 0,
          totalTransactions: 0,
          activeAccounts: 0,
          totalLocations: 0,
          monthlyTotal: 0,
          weeklyAverage: 0,
          transactionCount: 0,
          avgTransactionAmount: 0,
          topAccount: { name: 'No data', amount: 0 },
          recentTransactions: []
        })
      }
    }

    loadDashboardData()
  }, [selectedLocationId, selectedDate])

  return (
    <div className="space-y-3 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {formatDate(new Date())} • Business overview and insights
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Select value={selectedLocationId || 'all'} onValueChange={(value) =>
            setSelectedLocationId(value === 'all' ? null : value)
          }>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full sm:w-auto justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  if (date) {
                    setSelectedDate(date)
                    setIsCalendarOpen(false)
                  }
                }}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedDate(new Date())}
              className="text-xs"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const yesterday = new Date()
                yesterday.setDate(yesterday.getDate() - 1)
                setSelectedDate(yesterday)
              }}
              className="text-xs"
            >
              Yesterday
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-success/20 bg-success/5 min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Credits</CardTitle>
            <TrendingUp className="h-4 w-4 text-success flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-success truncate">
              {formatCurrency(dashboardData.selectedDateCredits)}
            </div>
            <p className="text-xs text-muted-foreground">
              Money received on {format(selectedDate, 'MMM dd')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5 min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Debits</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-destructive truncate">
              {formatCurrency(dashboardData.selectedDateDebits)}
            </div>
            <p className="text-xs text-muted-foreground">
              Payments made on {format(selectedDate, 'MMM dd')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5 min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Net Balance</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold truncate ${dashboardData.netBalance >= 0 ? 'text-success' : 'text-destructive'
              }`}>
              {formatCurrency(dashboardData.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Net for {format(selectedDate, 'MMM dd')}
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-orange-500/5 min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Commission</CardTitle>
            <Receipt className="h-4 w-4 text-orange-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-500 truncate">
              {formatCurrency(dashboardData.selectedDateCommissions)}
            </div>
            <p className="text-xs text-muted-foreground">
              Commission on {format(selectedDate, 'MMM dd')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Key Metrics
            </CardTitle>
            <CardDescription>
              Performance insights for {format(selectedDate, 'MMMM dd, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Transactions</p>
                <p className="text-2xl font-bold">{dashboardData.transactionCount}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Amount</p>
                <p className="text-2xl font-bold">{formatCurrencyCompact(dashboardData.avgTransactionAmount)}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Top Account</p>
              <p className="text-lg font-semibold">{dashboardData.topAccount.name}</p>
              <p className="text-sm text-muted-foreground">{formatCurrency(dashboardData.topAccount.amount)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Weekly Average</p>
              <p className="text-lg font-semibold">{formatCurrency(dashboardData.weeklyAverage)}</p>
              <p className="text-xs text-muted-foreground">Daily average for last 7 days</p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>
              Latest transactions for {format(selectedDate, 'MMMM dd, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentTransactions.length > 0 ? (
                dashboardData.recentTransactions.map((transaction, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.type === 'credit' ? 'bg-success' : 'bg-destructive'
                      }`} />
                      <div>
                        <p className="text-sm font-medium">{transaction.accounts?.name || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{transaction.transaction_no}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${
                        transaction.type === 'credit' ? 'text-success' : 'text-destructive'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}{formatCurrencyCompact(transaction.amount)}
                      </p>
                      {transaction.commission > 0 && (
                        <p className="text-xs text-orange-600">
                          +{formatCurrencyCompact(transaction.commission)} comm.
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No transactions found for this date</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold">{dashboardData.totalTransactions}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Total Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-success flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold">{dashboardData.activeAccounts}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Active Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-destructive flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold">{dashboardData.totalLocations}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Business Locations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <IndianRupee className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-2xl font-bold truncate">{formatCurrencyCompact(dashboardData.monthlyTotal)}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">Monthly Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}