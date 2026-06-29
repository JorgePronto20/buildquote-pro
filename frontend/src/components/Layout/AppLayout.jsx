import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  return (
    <div className="min-h-screen bg-gray-100 lg:flex">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="min-w-0 flex-1">
        <TopBar onMenu={() => setOpen(true)} />
        <main className="p-4 lg:p-8 print:p-0"><Outlet /></main>
      </div>
    </div>
  )
}
