import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Bookmark,
  FlaskConical,
  Settings,
  Search,
  Menu,
  X,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { useProfile } from '../lib/profile'
import { useTheme, type ThemeChoice } from '../lib/theme'
import { isTypingTarget, triggerNew } from '../lib/shortcuts'
import { SearchPalette } from './SearchPalette'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/projecten', label: 'Projecten', icon: FolderKanban },
  { to: '/briefs', label: 'Brief Builder', icon: FileText },
  { to: '/swipe', label: 'Swipe File', icon: Bookmark },
  { to: '/testlog', label: 'Testlog', icon: FlaskConical },
  { to: '/instellingen', label: 'Instellingen', icon: Settings },
]

export function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => setMobileOpen(false), [location.pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return
      if (e.key === '/') {
        e.preventDefault()
        setSearchOpen(true)
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        triggerNew(() => navigate('/projecten/nieuw'))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <div className="flex h-full">
      {/* Mobiele overlay */}
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-zinc-200 bg-zinc-50 transition-transform dark:border-zinc-800 dark:bg-[#0c0c0f] lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onSearch={() => setSearchOpen(true)} onClose={() => setMobileOpen(false)} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-12 items-center gap-2 border-b border-zinc-200 px-3 lg:hidden dark:border-zinc-800">
          <button className="rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setMobileOpen(true)} aria-label="Menu openen">
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold">Strategist OS</span>
          <button className="ml-auto rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => setSearchOpen(true)} aria-label="Zoeken">
            <Search className="size-5" />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8">
            <Outlet />
          </div>
        </main>
      </div>

      {searchOpen && <SearchPalette onClose={() => setSearchOpen(false)} />}
    </div>
  )
}

function Sidebar({ onSearch, onClose }: { onSearch: () => void; onClose: () => void }) {
  const { data: profile } = useProfile()
  return (
    <>
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex size-7 items-center justify-center rounded-md bg-accent-600 text-xs font-bold text-white">S</div>
        <span className="text-sm font-semibold tracking-tight">Strategist OS</span>
        <button className="ml-auto rounded p-1 hover:bg-zinc-200 lg:hidden dark:hover:bg-zinc-800" onClick={onClose} aria-label="Menu sluiten">
          <X className="size-4" />
        </button>
      </div>

      <div className="px-3">
        <button
          onClick={onSearch}
          className="flex w-full items-center gap-2 rounded-md border border-zinc-200 bg-white px-2.5 py-1.5 text-sm text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <Search className="size-4" />
          Zoeken
          <span className="kbd ml-auto">/</span>
        </button>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-0.5 px-3">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                isActive
                  ? 'bg-white font-medium text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-white dark:ring-zinc-700'
                  : 'text-zinc-600 hover:bg-zinc-200/60 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-100'
              }`
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <ThemeSwitch />
        <NavLink to="/instellingen" className="mt-3 flex items-center gap-2 rounded-md p-1 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60">
          <div className="flex size-7 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium uppercase dark:bg-zinc-800">
            {profile?.naam?.[0] ?? '?'}
          </div>
          <span className="min-w-0 flex-1 truncate text-xs text-zinc-500">{profile?.naam || 'Lokaal profiel'}</span>
        </NavLink>
        <p className="mt-3 hidden text-[11px] text-zinc-400 lg:block">
          <span className="kbd">N</span> nieuw · <span className="kbd">/</span> zoeken
        </p>
      </div>
    </>
  )
}

function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const opts: { v: ThemeChoice; icon: typeof Sun; label: string }[] = [
    { v: 'light', icon: Sun, label: 'Licht' },
    { v: 'dark', icon: Moon, label: 'Donker' },
    { v: 'system', icon: Monitor, label: 'Systeem' },
  ]
  return (
    <div className="flex rounded-md bg-zinc-200/60 p-0.5 dark:bg-zinc-800/60">
      {opts.map(({ v, icon: Icon, label }) => (
        <button
          key={v}
          onClick={() => setTheme(v)}
          title={label}
          className={`flex flex-1 items-center justify-center rounded py-1 ${
            theme === v ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
          }`}
        >
          <Icon className="size-3.5" />
        </button>
      ))}
    </div>
  )
}
