import { ReactNode } from "react"
import { Sidebar } from "./Sidebar"

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <main className="p-6 pt-16 lg:pt-6">
          {children}
        </main>
      </div>
    </div>
  )
}