import { ReactNode } from "react"
import { Sidebar } from "./Sidebar"

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="lg:flex">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <main className="p-4 sm:p-6 pt-16 lg:pt-4 sm:lg:pt-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}