import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Users,
  MapPin,
  Receipt,
  Calendar
} from 'lucide-react'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/currency'
import { formatDate, getDateRange } from '@/lib/utils/date'
import { useAppStore } from '@/store/useAppStore'
import { transactionsApi, accountsApi, locationsApi } from '@/lib/api'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Pie, PieChart, Cell } from 'recharts'



export default function Dashboard() {
  const { selectedLocationId, setSelectedLocationId } = useAppStore()
  const [dashboardData, setDashboardData] = useState({
    todayCredits: 0,
    todayDebits: 0,
    netBalance: 0,
    todayCommissions: 0,
    totalTransactions: 0,
    activeAccounts: 0,
    totalLocations: 0,
    monthlyTotal: 0,

    accountData: [] as Array<{ name: string; total: number; color: string }>
  })
  const [locations, setLocations] = useState<any[]>([])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load all required data in parallel
        const [stats, locationsData, accountsData] = await Promise.all([
          transactionsApi.getDashboardStats(selectedLocationId || undefined),
          locationsApi.getAll(),
          accountsApi.getAll()
        ])
        
        // Get last 7 days transactions for chart
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
        
        const { data: recentTransactions } = await transactionsApi.getAll({
          location_id: selectedLocationId || undefined,
          date_from: sevenDaysAgo.toISOString().split('T')[0],
          limit: 1000
        })

        // Get monthly transactions for monthly total
        const firstDayOfMonth = new Date()
        firstDayOfMonth.setDate(1)
        
        const { data: monthlyTransactions } = await transactionsApi.getAll({
          location_id: selectedLocationId || undefined,
          date_from: firstDayOfMonth.toISOString().split('T')[0],
          limit: 1000
        })

        const monthlyTotal = monthlyTransactions.reduce((sum, t) => {
          return sum + (t.type === 'credit' ? Number(t.amount) : -Number(t.amount))
        }, 0)



        // Get account-wise data
        const accountSummary = recentTransactions.reduce((acc: any, transaction) => {
          const accountName = transaction.accounts?.name || 'Unknown'
          if (!acc[accountName]) {
            acc[accountName] = 0
          }
          acc[accountName] += Number(transaction.amount)
          return acc
        }, {})

        const accountData = Object.entries(accountSummary)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 4)
          .map(([name, total], index) => ({
            name,
            total: total as number,
            color: `hsl(var(--chart-${index + 1}))`
          }))

        // Count unique accounts that have transactions
        const uniqueAccounts = new Set(recentTransactions.map(t => t.account_id))

        setLocations(locationsData)
        setDashboardData({
          todayCredits: stats.todayCredits,
          todayDebits: stats.todayDebits,
          netBalance: stats.netBalance,
          todayCommissions: stats.todayCommissions,
          totalTransactions: stats.totalTransactions,
          activeAccounts: uniqueAccounts.size,
          totalLocations: locationsData.length,
          monthlyTotal,
          accountData
        })
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
        // Fallback to empty state
        setDashboardData({
          todayCredits: 0,
          todayDebits: 0,
          netBalance: 0,
          todayCommissions: 0,
          totalTransactions: 0,
          activeAccounts: 0,
          totalLocations: 0,
          monthlyTotal: 0,
          accountData: []
        })
      }
    }

    loadDashboardData()
  }, [selectedLocationId])

  const chartConfig = {
    credits: { label: 'Credits', color: 'hsl(var(--success))' },
    debits: { label: 'Debits', color: 'hsl(var(--destructive))' },
    net: { label: 'Net Balance', color: 'hsl(var(--primary))' }
  }

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

          <Badge variant="outline" className="flex items-center gap-1 self-start">
            <Calendar className="w-3 h-3" />
            Today
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="border-success/20 bg-success/5 min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Today's Credits</CardTitle>
            <TrendingUp className="h-4 w-4 text-success flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-success truncate">
              {formatCurrency(dashboardData.todayCredits)}
            </div>
            <p className="text-xs text-muted-foreground">
              Money received from customers
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5 min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Today's Debits</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-destructive truncate">
              {formatCurrency(dashboardData.todayDebits)}
            </div>
            <p className="text-xs text-muted-foreground">
              Payments made to vendors
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
              Credits minus debits today
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-orange-500/5 min-w-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium truncate">Today's Commission</CardTitle>
            <Receipt className="h-4 w-4 text-orange-500 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-orange-500 truncate">
              {formatCurrency(dashboardData.todayCommissions)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total commission earned today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Account-wise Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Account-wise Distribution
            </CardTitle>
            <CardDescription>
              Total transaction amounts by account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="w-full overflow-hidden">
              <ChartContainer config={chartConfig} className="h-64 sm:h-80 w-full">
                <PieChart>
                  <Pie
                    data={dashboardData.accountData}
                    dataKey="total"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                  >
                    {dashboardData.accountData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => [formatCurrencyCompact(value), '']}
                  />
                </PieChart>
              </ChartContainer>
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {dashboardData.accountData.map((item, index) => (
                <div key={index} className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground truncate">
                    {item.name}
                  </span>
                </div>
              ))}
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