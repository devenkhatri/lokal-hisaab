import { useEffect } from "react"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as Sonner } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { useAppStore } from "@/store/useAppStore"
import { dummyAuth } from "@/lib/supabase"
import { Layout } from "@/components/layout/Layout"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import NotFound from "./pages/NotFound"

const queryClient = new QueryClient()

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAppStore(state => state.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const App = () => {
  const { isAuthenticated, setAuthenticated } = useAppStore()

  useEffect(() => {
    // Check if user is already authenticated on app load
    if (dummyAuth.isAuthenticated()) {
      setAuthenticated(true)
    }
  }, [setAuthenticated])

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            {/* Placeholder routes for other pages */}
            <Route path="/transactions" element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Transactions</h1>
                    <p className="text-muted-foreground">Coming soon...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/accounts" element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Accounts</h1>
                    <p className="text-muted-foreground">Coming soon...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/locations" element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Locations</h1>
                    <p className="text-muted-foreground">Coming soon...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute>
                <Layout>
                  <div className="p-8 text-center">
                    <h1 className="text-2xl font-bold">Reports</h1>
                    <p className="text-muted-foreground">Coming soon...</p>
                  </div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  )
}

export default App
