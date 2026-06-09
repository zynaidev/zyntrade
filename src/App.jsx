import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import StrategyChecklist from './pages/StrategyChecklist'
import WorldClocks from './pages/WorldClocks'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-[#0b0e14] text-white">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/checklist" element={<StrategyChecklist />} />
            <Route path="/clocks" element={<WorldClocks />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}
