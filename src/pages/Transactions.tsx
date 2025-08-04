import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Download, Edit, Trash2, Eye, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { transactionsApi, accountsApi, locationsApi } from '@/lib/api'
import { formatCurrency, parseCurrency } from '@/lib/utils/currency'
import { formatDate, formatDateForInput } from '@/lib/utils/date'
import { cn } from '@/lib/utils'

interface TransactionFilters {
  location_id?: string
  account_id?: string
  type?: 'credit' | 'debit'
  date_from?: string
  date_to?: string
  search?: string
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<any[]>([])
  const [accounts, setAccounts] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<TransactionFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [importing, setImporting] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    transaction_no: '',
    date: new Date(),
    amount: '',
    type: 'credit' as 'credit' | 'debit',
    account_id: '',
    location_id: '',
    description: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [transactionsResult, accountsResult, locationsResult] = await Promise.all([
        transactionsApi.getAll({ ...filters, page: currentPage, limit: 20 }),
        accountsApi.getAll(),
        locationsApi.getAll()
      ])

      setTransactions(transactionsResult.data)
      setTotalPages(Math.ceil(transactionsResult.count / 20))
      setAccounts(accountsResult)
      setLocations(locationsResult)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filters, currentPage])

  // Generate transaction number in YYYYMMDD-SequenceNo format
  const generateTransactionNo = async (): Promise<string> => {
    const today = format(new Date(), 'yyyyMMdd')
    
    try {
      // Get today's transactions to find the next sequence number
      const { data: todayTransactions } = await transactionsApi.getAll({
        date_from: format(new Date(), 'yyyy-MM-dd'),
        date_to: format(new Date(), 'yyyy-MM-dd'),
        limit: 1000 // Get all today's transactions
      })
      
      // Find the highest sequence number for today
      const todayTxnNos = todayTransactions
        .map(t => t.transaction_no)
        .filter(txnNo => txnNo.startsWith(today))
        .map(txnNo => {
          const parts = txnNo.split('-')
          return parts.length > 1 ? parseInt(parts[1]) : 0
        })
        .filter(num => !isNaN(num))
      
      const nextSequence = todayTxnNos.length > 0 ? Math.max(...todayTxnNos) + 1 : 1
      return `${today}-${nextSequence.toString().padStart(3, '0')}`
    } catch (error) {
      // Fallback to timestamp-based if API call fails
      return `${today}-${Date.now().toString().slice(-3)}`
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const transactionNo = formData.transaction_no || await generateTransactionNo()
      
      const transactionData = {
        ...formData,
        date: format(formData.date, 'yyyy-MM-dd'),
        amount: parseCurrency(formData.amount),
        transaction_no: transactionNo
      }

      if (editingTransaction) {
        await transactionsApi.update(editingTransaction.id, transactionData)
        toast({ title: "Success", description: "Transaction updated successfully" })
      } else {
        await transactionsApi.create(transactionData)
        toast({ title: "Success", description: "Transaction created successfully" })
      }

      setIsFormOpen(false)
      setEditingTransaction(null)
      resetForm()
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await transactionsApi.delete(id)
      toast({ title: "Success", description: "Transaction deleted successfully" })
      loadData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      transaction_no: '',
      date: new Date(),
      amount: '',
      type: 'credit',
      account_id: '',
      location_id: '',
      description: ''
    })
  }

  const openEditDialog = (transaction: any) => {
    setEditingTransaction(transaction)
    setFormData({
      transaction_no: transaction.transaction_no,
      date: new Date(transaction.date),
      amount: transaction.amount.toString(),
      type: transaction.type,
      account_id: transaction.account_id,
      location_id: transaction.location_id,
      description: transaction.description || ''
    })
    setIsFormOpen(true)
  }

  const exportToCSV = () => {
    const csvData = transactions.map(t => ({
      'Transaction No': t.transaction_no,
      'Date': formatDate(t.date),
      'Amount': t.amount,
      'Type': t.type,
      'Account': t.accounts?.name,
      'Location': t.locations?.name,
      'Description': t.description
    }))

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        'Transaction No': '20250804-001',
        'Date': '2025-08-04',
        'Amount': '5000',
        'Type': 'credit',
        'Account Name': 'Amit Patel',
        'Location Name': 'Mumbai Branch',
        'Description': 'Payment received from client'
      },
      {
        'Transaction No': '20250804-002',
        'Date': '2025-08-04',
        'Amount': '1500',
        'Type': 'debit',
        'Account Name': 'Neha Joshi',
        'Location Name': 'Delhi Branch',
        'Description': 'Office supplies purchase'
      },
      {
        'Transaction No': '20250803-001',
        'Date': '2025-08-03',
        'Amount': '25000',
        'Type': 'credit',
        'Account Name': 'Rajesh Kumar',
        'Location Name': 'Bangalore Branch',
        'Description': 'Monthly rent payment'
      }
    ]

    const csv = [
      Object.keys(sampleData[0]).join(','),
      ...sampleData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-transactions.csv'
    a.click()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportFile(file)
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        toast({
          title: "Error",
          description: "CSV file must have at least a header and one data row",
          variant: "destructive"
        })
        return
      }

      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
      const expectedHeaders = ['Transaction No', 'Date', 'Amount', 'Type', 'Account Name', 'Location Name', 'Description']
      
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h))
      if (missingHeaders.length > 0) {
        toast({
          title: "Error",
          description: `Missing required columns: ${missingHeaders.join(', ')}`,
          variant: "destructive"
        })
        return
      }

      const preview = lines.slice(1, 6).map((line, index) => {
        const values = line.split(',').map(v => v.replace(/"/g, '').trim())
        const row: any = {}
        headers.forEach((header, i) => {
          row[header] = values[i] || ''
        })
        row.rowIndex = index + 1
        return row
      })

      setImportPreview(preview)
    }
    
    reader.readAsText(file)
  }

  const processImport = async () => {
    if (!importFile) return

    setImporting(true)
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
        
        let successCount = 0
        let errorCount = 0
        
        for (let i = 1; i < lines.length; i++) {
          try {
            const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
            const row: any = {}
            headers.forEach((header, index) => {
              row[header] = values[index] || ''
            })

            // Find account and location by name
            const account = accounts.find(a => a.name === row['Account Name'])
            const location = locations.find(l => l.name === row['Location Name'])
            
            if (!account) {
              console.error(`Account not found: ${row['Account Name']}`)
              errorCount++
              continue
            }
            
            if (!location) {
              console.error(`Location not found: ${row['Location Name']}`)
              errorCount++
              continue
            }

            const transactionData = {
              transaction_no: row['Transaction No'] || await generateTransactionNo(),
              date: row['Date'],
              amount: parseFloat(row['Amount']),
              type: row['Type'].toLowerCase() as 'credit' | 'debit',
              account_id: account.id,
              location_id: location.id,
              description: row['Description'] || ''
            }

            await transactionsApi.create(transactionData)
            successCount++
          } catch (error) {
            console.error(`Error importing row ${i}:`, error)
            errorCount++
          }
        }

        toast({
          title: "Import Complete",
          description: `Successfully imported ${successCount} transactions. ${errorCount} errors occurred.`,
          variant: successCount > 0 ? "default" : "destructive"
        })

        setIsImportOpen(false)
        setImportFile(null)
        setImportPreview([])
        loadData()
      }
      
      reader.readAsText(importFile)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import transactions",
        variant: "destructive"
      })
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground">Manage all business transactions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          
          <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Import Transactions from CSV</DialogTitle>
                <DialogDescription>
                  Upload a CSV file to bulk import transactions. 
                  <Button variant="link" className="p-0 h-auto" onClick={downloadSampleCSV}>
                    Download sample CSV
                  </Button> to see the required format.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground">
                    Required columns: Transaction No, Date, Amount, Type, Account Name, Location Name, Description
                  </p>
                </div>

                {importPreview.length > 0 && (
                  <div className="space-y-2">
                    <Label>Preview (First 5 rows)</Label>
                    <div className="border rounded-md overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Transaction No</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Account</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importPreview.map((row, index) => (
                            <TableRow key={index}>
                              <TableCell>{row['Transaction No']}</TableCell>
                              <TableCell>{row['Date']}</TableCell>
                              <TableCell>{row['Amount']}</TableCell>
                              <TableCell>
                                <Badge variant={row['Type'] === 'credit' ? 'default' : 'secondary'}>
                                  {row['Type']}
                                </Badge>
                              </TableCell>
                              <TableCell>{row['Account Name']}</TableCell>
                              <TableCell>{row['Location Name']}</TableCell>
                              <TableCell className="max-w-32 truncate">{row['Description']}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={processImport} 
                    disabled={!importFile || importing}
                    className="flex-1"
                  >
                    {importing ? 'Importing...' : 'Import Transactions'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsImportOpen(false)
                      setImportFile(null)
                      setImportPreview([])
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingTransaction(null) }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                </DialogTitle>
                <DialogDescription>
                  {editingTransaction ? 'Update transaction details' : 'Create a new transaction entry'}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transaction_no">Transaction No</Label>
                    <Input
                      id="transaction_no"
                      value={formData.transaction_no}
                      onChange={(e) => setFormData(prev => ({ ...prev, transaction_no: e.target.value }))}
                      placeholder="Auto-generated"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.date, 'dd/MM/yyyy')}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.date}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.type} onValueChange={(value: 'credit' | 'debit') => 
                      setFormData(prev => ({ ...prev, type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit">Credit</SelectItem>
                        <SelectItem value="debit">Debit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_id">Account</Label>
                  <Select value={formData.account_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, account_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location_id">Location</Label>
                  <Select value={formData.location_id} onValueChange={(value) => 
                    setFormData(prev => ({ ...prev, location_id: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Transaction description"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    {editingTransaction ? 'Update' : 'Create'} Transaction
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Transaction no, description..."
                  className="pl-10"
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>

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
              <Label>Type</Label>
              <Select value={filters.type || 'all'} onValueChange={(value) => 
                setFilters(prev => ({ ...prev, type: value === 'all' ? undefined : value as 'credit' | 'debit' }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
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

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            {transactions.length} transactions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {transaction.transaction_no}
                      </TableCell>
                      <TableCell>{formatDate(transaction.date)}</TableCell>
                      <TableCell>
                        <span className={transaction.type === 'credit' ? 'text-success' : 'text-destructive'}>
                          {formatCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'credit' ? 'default' : 'destructive'}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{transaction.accounts?.name}</TableCell>
                      <TableCell>{transaction.locations?.name}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(transaction)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(transaction.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}