import { useState, useEffect } from 'react'
import { Download, Filter, Calendar, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { useToast } from '@/hooks/use-toast'
import { transactionsApi, accountsApi, locationsApi } from '@/lib/api'
import { formatCurrency, formatCurrencyCompact } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'
import { format } from 'date-fns'

interface ReportFilters {
  location_id?: string
  account_id?: string
  date_from?: string
  date_to?: string
}

export default function Reports() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ReportFilters>({})
  const [reportData, setReportData] = useState<any>({})
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setLoading(true)
      const [transactionsResult, accountsResult, locationsResult] = await Promise.all([
        transactionsApi.getAll({ ...filters, limit: 1000 }),
        accountsApi.getAll(),
        locationsApi.getAll()
      ])

      setTransactions(transactionsResult.data)
      setAccounts(accountsResult)
      setLocations(locationsResult)

      generateReportData(transactionsResult.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generateReportData = (transactionData: any[]) => {
    // Daily summary
    const dailySummary = transactionData.reduce((acc: any, transaction) => {
      const date = transaction.date
      if (!acc[date]) {
        acc[date] = { date, credits: 0, debits: 0, net: 0, count: 0, commission: 0 }
      }

      const amount = Number(transaction.amount)
      const commission = Number(transaction.commission || 0)
      acc[date].count++
      acc[date].commission += commission

      if (transaction.type === 'credit') {
        acc[date].credits += amount
      } else {
        acc[date].debits += amount
      }
      acc[date].net = acc[date].credits - acc[date].debits

      return acc
    }, {})

    // Account summary
    const accountSummary = transactionData.reduce((acc: any, transaction) => {
      const accountId = transaction.account_id
      const accountName = transaction.accounts?.name || 'Unknown'

      if (!acc[accountId]) {
        acc[accountId] = {
          accountId,
          accountName,
          credits: 0,
          debits: 0,
          net: 0,
          count: 0
        }
      }

      const amount = Number(transaction.amount)
      acc[accountId].count++

      if (transaction.type === 'credit') {
        acc[accountId].credits += amount
      } else {
        acc[accountId].debits += amount
      }
      acc[accountId].net = acc[accountId].credits - acc[accountId].debits

      return acc
    }, {})

    // Location summary
    const locationSummary = transactionData.reduce((acc: any, transaction) => {
      const locationId = transaction.location_id
      const locationName = transaction.locations?.name || 'Unknown'

      if (!acc[locationId]) {
        acc[locationId] = {
          locationId,
          locationName,
          credits: 0,
          debits: 0,
          net: 0,
          count: 0
        }
      }

      const amount = Number(transaction.amount)
      acc[locationId].count++

      if (transaction.type === 'credit') {
        acc[locationId].credits += amount
      } else {
        acc[locationId].debits += amount
      }
      acc[locationId].net = acc[locationId].credits - acc[locationId].debits

      return acc
    }, {})

    // Total calculations
    const totalCredits = transactionData
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalDebits = transactionData
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    const totalCommissions = transactionData
      .reduce((sum, t) => sum + Number(t.commission || 0), 0)

    // Commission summary by account
    const commissionSummary = transactionData.reduce((acc: any, transaction) => {
      const accountId = transaction.account_id
      const accountName = transaction.accounts?.name || 'Unknown'
      const commission = Number(transaction.commission || 0)

      if (commission > 0) {
        if (!acc[accountId]) {
          acc[accountId] = {
            accountId,
            accountName,
            totalCommission: 0,
            transactionCount: 0,
            avgCommission: 0
          }
        }

        acc[accountId].totalCommission += commission
        acc[accountId].transactionCount++
        acc[accountId].avgCommission = acc[accountId].totalCommission / acc[accountId].transactionCount
      }

      return acc
    }, {})

    setReportData({
      dailySummary: Object.values(dailySummary).sort((a: any, b: any) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
      accountSummary: Object.values(accountSummary).sort((a: any, b: any) => b.net - a.net),
      locationSummary: Object.values(locationSummary).sort((a: any, b: any) => b.net - a.net),
      commissionSummary: Object.values(commissionSummary).sort((a: any, b: any) => b.totalCommission - a.totalCommission),
      totalCredits,
      totalDebits,
      netBalance: totalCredits - totalDebits,
      totalCommissions,
      totalTransactions: transactionData.length
    })
  }

  useEffect(() => {
    loadData()
  }, [filters])

  const exportToCSV = (data: any[], filename: string) => {
    if (!data.length) return

    const headers = Object.keys(data[0])
    const csv = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Business analytics and financial reports</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Location</Label>
              <Select value={filters.location_id || 'all'} onValueChange={(value) =>
                setFilters(prev => ({ ...prev, location_id: value === 'all' ? undefined : value }))
              }>
                <SelectTrigger>
                  <SelectValue />
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
            </div>

            <div className="space-y-2">
              <Label>Account</Label>
              <Select value={filters.account_id || 'all'} onValueChange={(value) =>
                setFilters(prev => ({ ...prev, account_id: value === 'all' ? undefined : value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setFilters({})}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <Card className="border-success/20 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">
                  {formatCurrencyCompact(reportData.totalCredits || 0)}
                </p>
                <p className="text-xs text-success/70 font-medium">
                  {formatCurrency(reportData.totalCredits || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Credits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrencyCompact(reportData.totalDebits || 0)}
                </p>
                <p className="text-xs text-destructive/70 font-medium">
                  {formatCurrency(reportData.totalDebits || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Debits</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-bold">₹</span>
              </div>
              <div>
                <p className={`text-2xl font-bold ${(reportData.netBalance || 0) >= 0 ? 'text-success' : 'text-destructive'
                  }`}>
                  {formatCurrencyCompact(reportData.netBalance || 0)}
                </p>
                <p className={`text-xs font-medium ${(reportData.netBalance || 0) >= 0 ? 'text-success/70' : 'text-destructive/70'
                  }`}>
                  {formatCurrency(reportData.netBalance || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Net Balance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <span className="text-white text-sm font-bold">%</span>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-500">
                  {formatCurrencyCompact(reportData.totalCommissions || 0)}
                </p>
                <p className="text-xs text-orange-500/70 font-medium">
                  {formatCurrency(reportData.totalCommissions || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Commission</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-accent-foreground" />
              <div>
                <p className="text-2xl font-bold">{reportData.totalTransactions || 0}</p>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Commission Report */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Commission Report</CardTitle>
            <CardDescription>Commission earnings for selected period</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToCSV(reportData.commissionSummary || [], 'commission-report')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Commission Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(reportData.totalCommissions || 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Commission</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {reportData.commissionSummary?.length || 0}
              </p>
              <p className="text-sm text-muted-foreground">Accounts with Commission</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {reportData.commissionSummary?.reduce((sum: number, acc: any) => sum + acc.transactionCount, 0) || 0}
              </p>
              <p className="text-sm text-muted-foreground">Commission Transactions</p>
            </div>
          </div>

          {/* Account-wise Commission Table */}
          <div>
            <h4 className="text-lg font-semibold mb-3">Account-wise Commission Breakdown</h4>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Total Commission</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Average Commission</TableHead>
                    <TableHead>% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.commissionSummary?.length > 0 ? (
                    reportData.commissionSummary.map((account: any) => (
                      <TableRow key={account.accountId}>
                        <TableCell className="font-medium">{account.accountName}</TableCell>
                        <TableCell className="text-orange-600 font-semibold">
                          {formatCurrency(account.totalCommission)}
                        </TableCell>
                        <TableCell>{account.transactionCount}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCurrency(account.avgCommission)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {reportData.totalCommissions > 0
                            ? `${((account.totalCommission / reportData.totalCommissions) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No commission data available for the selected period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Account-wise Summary</CardTitle>
              <CardDescription>Performance by account</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(reportData.accountSummary || [], 'account-summary')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Debits</TableHead>
                    <TableHead>Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.accountSummary?.map((account: any) => (
                    <TableRow key={account.accountId}>
                      <TableCell className="font-medium">{account.accountName}</TableCell>
                      <TableCell className="text-success">
                        {formatCurrency(account.credits)}
                      </TableCell>
                      <TableCell className="text-destructive">
                        {formatCurrency(account.debits)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.net >= 0 ? 'default' : 'destructive'}>
                          {formatCurrency(account.net)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Location Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Location-wise Summary</CardTitle>
              <CardDescription>Performance by location</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV(reportData.locationSummary || [], 'location-summary')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Location</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Debits</TableHead>
                    <TableHead>Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.locationSummary?.map((location: any) => (
                    <TableRow key={location.locationId}>
                      <TableCell className="font-medium">{location.locationName}</TableCell>
                      <TableCell className="text-success">
                        {formatCurrency(location.credits)}
                      </TableCell>
                      <TableCell className="text-destructive">
                        {formatCurrency(location.debits)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={location.net >= 0 ? 'default' : 'destructive'}>
                          {formatCurrency(location.net)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Summary Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Daily Summary Report</CardTitle>
            <CardDescription>Day-wise transaction breakdown</CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => exportToCSV(reportData.dailySummary || [], 'daily-summary')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Debits</TableHead>
                  <TableHead>Net Balance</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Transactions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.dailySummary?.map((day: any) => (
                  <TableRow key={day.date}>
                    <TableCell className="font-medium">{formatDate(day.date)}</TableCell>
                    <TableCell className="text-success">
                      {formatCurrency(day.credits)}
                    </TableCell>
                    <TableCell className="text-destructive">
                      {formatCurrency(day.debits)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={day.net >= 0 ? 'default' : 'destructive'}>
                        {formatCurrency(day.net)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-orange-600 font-semibold">
                      {formatCurrency(day.commission)}
                    </TableCell>
                    <TableCell>{day.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}