import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp, 
  TrendingDown, 
  IndianRupee, 
  Users, 
  MapPin,
  Receipt,
  Calendar,
  BarChart3
} from 'lucide-react'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/currency'
import { formatDate, isToday, getDateRange } from '@/lib/utils/date'
import { useAppStore } from '@/store/useAppStore'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, BarChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid } from 'recharts'

// Mock data - replace with actual API calls
const mockTransactions = [
  { id: '1', date: '2024-01-20', amount: 15000, type: 'credit', account_id: '1', location_id: '1' },
  { id: '2', date: '2024-01-20', amount: 8000, type: 'debit', account_id: '2', location_id: '1' },
  { id: '3', date: '2024-01-19', amount: 25000, type: 'credit', account_id: '3', location_id: '2' },
  { id: '4', date: '2024-01-19', amount: 12000, type: 'debit', account_id: '1', location_id: '2' },
]

const mockLocations = [
  { id: '1', name: 'Mumbai Branch', address: 'Andheri East, Mumbai' },
  { id: '2', name: 'Delhi Branch', address: 'Connaught Place, New Delhi' },
  { id: '3', name: 'Bangalore Branch', address: 'Koramangala, Bangalore' },
]

export default function Dashboard() {
  const { selectedLocationId, setSelectedLocationId } = useAppStore()
  const [dashboardData, setDashboardData] = useState({
    todayCredits: 0,
    todayDebits: 0,
    netBalance: 0,
    dailyData: [] as Array<{ date: string; credits: number; debits: number; net: number }>,
    accountData: [] as Array<{ name: string; total: number; color: string }>
  })

  useEffect(() => {
    // Calculate dashboard metrics
    const today = new Date().toISOString().split('T')[0]
    const { start } = getDateRange(7)
    
    // Filter transactions by location if selected
    const filteredTransactions = selectedLocationId 
      ? mockTransactions.filter(t => t.location_id === selectedLocationId)
      : mockTransactions

    // Today's totals
    const todayTransactions = filteredTransactions.filter(t => t.date === today)
    const todayCredits = todayTransactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0)
    const todayDebits = todayTransactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0)

    // Last 7 days data
    const dailyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      const dayTransactions = filteredTransactions.filter(t => t.date === dateStr)
      const credits = dayTransactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0)
      const debits = dayTransactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0)
      
      dailyData.push({
        date: formatDate(date).split('/').slice(0, 2).join('/'),
        credits,
        debits,
        net: credits - debits
      })
    }

    // Account-wise data (mock)
    const accountData = [
      { name: 'Rajesh Kumar', total: 45000, color: 'hsl(var(--chart-1))' },
      { name: 'Priya Sharma', total: 32000, color: 'hsl(var(--chart-2))' },
      { name: 'Amit Patel', total: 28000, color: 'hsl(var(--chart-3))' },
      { name: 'Others', total: 15000, color: 'hsl(var(--chart-4))' },
    ]

    setDashboardData({
      todayCredits,
      todayDebits,
      netBalance: todayCredits - todayDebits,
      dailyData,
      accountData
    })
  }, [selectedLocationId])

  const chartConfig = {
    credits: { label: 'Credits', color: 'hsl(var(--success))' },
    debits: { label: 'Debits', color: 'hsl(var(--destructive))' },
    net: { label: 'Net Balance', color: 'hsl(var(--primary))' }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {formatDate(new Date())} • Business overview and insights
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedLocationId || 'all'} onValueChange={(value) => 
            setSelectedLocationId(value === 'all' ? null : value)
          }>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {mockLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Today
          </Badge>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-success/20 bg-success/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Credits</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(dashboardData.todayCredits)}
            </div>
            <p className="text-xs text-muted-foreground">
              Money received from customers
            </p>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Debits</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(dashboardData.todayDebits)}
            </div>
            <p className="text-xs text-muted-foreground">
              Payments made to vendors
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <IndianRupee className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              dashboardData.netBalance >= 0 ? 'text-success' : 'text-destructive'
            }`}>
              {formatCurrency(dashboardData.netBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              Credits minus debits today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Balance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Daily Balance Trend
            </CardTitle>
            <CardDescription>
              Last 7 days credits vs debits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <BarChart data={dashboardData.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [formatCurrencyCompact(value), '']}
                />
                <Bar dataKey="credits" fill="var(--color-credits)" name="Credits" />
                <Bar dataKey="debits" fill="var(--color-debits)" name="Debits" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

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
            <ChartContainer config={chartConfig} className="h-80">
              <PieChart>
                <Pie
                  data={dashboardData.accountData}
                  dataKey="total"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
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
            
            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {dashboardData.accountData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-sm" 
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Receipt className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-success" />
              <div>
                <p className="text-2xl font-bold">6</p>
                <p className="text-sm text-muted-foreground">Active Accounts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Business Locations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <IndianRupee className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{formatCurrencyCompact(1250000)}</p>
                <p className="text-sm text-muted-foreground">Monthly Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}