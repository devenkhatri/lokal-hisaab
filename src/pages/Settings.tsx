import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

export default function Settings() {
  const [supabaseUrl, setSupabaseUrl] = useState("https://lqwomnekslvplfiqsmwk.supabase.co")
  const [supabaseKey, setSupabaseKey] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxd29tbmVrc2x2cGxmaXFzbXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNzM0NjQsImV4cCI6MjA2OTg0OTQ2NH0.epQzKzFYU1BaaMI0ia3IijkaJmMYkDr7pgkCkbrJXi0")
  const [isConnecting, setIsConnecting] = useState(false)
  const { toast } = useToast()

  const handleTestConnection = async () => {
    setIsConnecting(true)
    try {
      // Create a temporary client with the new credentials
      const { createClient } = await import('@supabase/supabase-js')
      const testClient = createClient(supabaseUrl, supabaseKey)
      
      // Test the connection by attempting to query the database
      const { error } = await testClient.from('dummy_table').select('*').limit(1)
      
      if (error && error.code !== 'PGRST106') { // PGRST106 = table not found, which means connection is working
        throw error
      }
      
      toast({
        title: "Connection successful",
        description: "Supabase connection details are valid",
      })
      
      // Store the new connection details in localStorage
      localStorage.setItem('supabase_url', supabaseUrl)
      localStorage.setItem('supabase_key', supabaseKey)
      
    } catch (error) {
      console.error('Connection test failed:', error)
      toast({
        title: "Connection failed",
        description: "Invalid Supabase connection details",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSaveSettings = () => {
    localStorage.setItem('supabase_url', supabaseUrl)
    localStorage.setItem('supabase_key', supabaseKey)
    
    toast({
      title: "Settings saved",
      description: "Connection details have been saved. Please refresh the page to apply changes.",
    })
  }

  const handleReset = () => {
    setSupabaseUrl("https://lqwomnekslvplfiqsmwk.supabase.co")
    setSupabaseKey("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxxd29tbmVrc2x2cGxmaXFzbXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyNzM0NjQsImV4cCI6MjA2OTg0OTQ2NH0.epQzKzFYU1BaaMI0ia3IijkaJmMYkDr7pgkCkbrJXi0")
    localStorage.removeItem('supabase_url')
    localStorage.removeItem('supabase_key')
    
    toast({
      title: "Settings reset",
      description: "Connection details have been reset to defaults.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure your application settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection</CardTitle>
          <CardDescription>
            Configure your Supabase project connection details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="supabase-url">Supabase URL</Label>
            <Input
              id="supabase-url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="supabase-key">Supabase Anon Key</Label>
            <Input
              id="supabase-key"
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="Your Supabase anonymous key"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handleTestConnection} 
              disabled={isConnecting}
              variant="outline"
            >
              {isConnecting ? "Testing..." : "Test Connection"}
            </Button>
            <Button onClick={handleSaveSettings}>
              Save Settings
            </Button>
            <Button onClick={handleReset} variant="outline">
              Reset to Default
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground mt-4">
            <p><strong>Note:</strong> After saving new connection details, please refresh the page for changes to take effect.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}