import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { accountsApi, transactionsApi } from '@/lib/api'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDate } from '@/lib/utils/date'

export default function Accounts() {
  const [accounts, setAccounts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<any>(null)
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [accountTransactions, setAccountTransactions] = useState<any[]>([])
  const [viewingAccount, setViewingAccount] = useState(false)
  const { toast } = useToast()

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone_number: ''
  })

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const data = await accountsApi.getAll()
      setAccounts(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load accounts",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAccountTransactions = async (accountId: string) => {
    try {
      const result = await transactionsApi.getAll({ account_id: accountId, limit: 100 })
      setAccountTransactions(result.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load account transactions",
        variant: "destructive"
      })
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingAccount) {
        await accountsApi.update(editingAccount.id, formData)
        toast({ title: "Success", description: "Account updated successfully" })
      } else {
        await accountsApi.create(formData)
        toast({ title: "Success", description: "Account created successfully" })
      }

      setIsFormOpen(false)
      setEditingAccount(null)
      resetForm()
      loadAccounts()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save account",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await accountsApi.delete(id)
      toast({ title: "Success", description: "Account deleted successfully" })
      loadAccounts()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone_number: ''
    })
  }

  const openEditDialog = (account: any) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      phone_number: account.phone_number || ''
    })
    setIsFormOpen(true)
  }

  const viewAccount = async (account: any) => {
    setSelectedAccount(account)
    setViewingAccount(true)
    await loadAccountTransactions(account.id)
  }

  const getAccountSummary = (transactions: any[]) => {
    const totalCredits = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const totalDebits = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    return {
      totalCredits,
      totalDebits,
      netBalance: totalCredits - totalDebits,
      transactionCount: transactions.length
    }
  }

  if (viewingAccount && selectedAccount) {
    const summary = getAccountSummary(accountTransactions)
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button variant="outline" onClick={() => setViewingAccount(false)}>
              ← Back to Accounts
            </Button>
            <h1 className="text-3xl font-bold text-foreground mt-4">{selectedAccount.name}</h1>
            <p className="text-muted-foreground">
              {selectedAccount.phone_number && (
                <span className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {selectedAccount.phone_number}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-success/20 bg-success/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-success rounded-md flex items-center justify-center">
                  <span className="text-success-foreground text-sm font-bold">₹</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-success">{formatCurrency(summary.totalCredits)}</p>
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-destructive rounded-md flex items-center justify-center">
                  <span className="text-destructive-foreground text-sm font-bold">₹</span>
                </div>
                <div>
                  <p className="text-lg font-bold text-destructive">{formatCurrency(summary.totalDebits)}</p>
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
                  <p className={`text-lg font-bold ${summary.netBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatCurrency(summary.netBalance)}
                  </p>
                  <p className="text-sm text-muted-foreground">Net Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent rounded-md flex items-center justify-center">
                  <span className="text-accent-foreground text-sm font-bold">#</span>
                </div>
                <div>
                  <p className="text-lg font-bold">{summary.transactionCount}</p>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>All transactions for this account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accountTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.transaction_no}</TableCell>
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
                      <TableCell>{transaction.locations?.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{transaction.description}</TableCell>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Accounts</h1>
          <p className="text-muted-foreground">Manage customer and vendor accounts</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingAccount(null) }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </DialogTitle>
              <DialogDescription>
                {editingAccount ? 'Update account details' : 'Create a new account'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Account Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter account name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_number">Phone Number</Label>
                <Input
                  id="phone_number"
                  value={formData.phone_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  {editingAccount ? 'Update' : 'Create'} Account
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Accounts</CardTitle>
          <CardDescription>
            {accounts.length} accounts registered
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
                    <TableHead>Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary-foreground" />
                          </div>
                          <div>
                            <p className="font-medium">{account.name}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {account.phone_number ? (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {account.phone_number}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No phone</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(account.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewAccount(account)}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(account)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(account.id)}
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
        </CardContent>
      </Card>
    </div>
  )
}