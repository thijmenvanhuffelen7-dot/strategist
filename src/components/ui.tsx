import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2, AlertTriangle } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

const variants: Record<Variant, string> = {
  primary: 'bg-accent-600 text-white hover:bg-accent-700 shadow-sm',
  secondary:
    'border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800',
  ghost: 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100',
  danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/40',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'sm' | 'md'
  loading?: boolean
  icon?: ReactNode
}) {
  const sizes = size === 'sm' ? 'h-7 px-2.5 text-xs gap-1.5' : 'h-9 px-3.5 text-sm gap-2'
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${sizes} ${variants[variant]} ${className}`}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : icon}
      {children}
    </button>
  )
}

export type PillColor = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'accent'

const pillColors: Record<PillColor, string> = {
  gray: 'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700',
  blue: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:ring-sky-900',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-900',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:ring-amber-900',
  red: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/50 dark:text-red-300 dark:ring-red-900',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:ring-violet-900',
  accent: 'bg-accent-50 text-accent-700 ring-accent-100 dark:bg-accent-600/15 dark:text-accent-100 dark:ring-accent-600/30',
}

export function Pill({ color = 'gray', children, dot }: { color?: PillColor; children: ReactNode; dot?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${pillColors[color]}`}
    >
      {dot && <span className="size-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  )
}

/** Statuslabels voor briefs en tests, centraal zodat de kleuren overal gelijk zijn. */
export const STATUS: Record<string, { label: string; color: PillColor }> = {
  concept: { label: 'Concept', color: 'gray' },
  klaar: { label: 'Klaar voor productie', color: 'blue' },
  in_productie: { label: 'In productie', color: 'amber' },
  live: { label: 'Live', color: 'green' },
  gearchiveerd: { label: 'Gearchiveerd', color: 'gray' },
  testen: { label: 'Testen', color: 'blue' },
  winnaar: { label: 'Winnaar', color: 'green' },
  verliezer: { label: 'Verliezer', color: 'red' },
  gestopt: { label: 'Gestopt', color: 'gray' },
}

export function StatusPill({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, color: 'gray' as const }
  return (
    <Pill color={s.color} dot>
      {s.label}
    </Pill>
  )
}

export function Spinner({ label = 'Laden…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 p-8 text-sm text-zinc-500">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  )
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const msg = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : String(error)
  return (
    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">Er ging iets mis</p>
        <p className="mt-0.5 opacity-90">{msg}</p>
      </div>
      {onRetry && (
        <Button size="sm" onClick={onRetry}>
          Opnieuw proberen
        </Button>
      )}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  children,
  actions,
}: {
  icon?: ReactNode
  title: string
  children?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-zinc-300 px-6 py-14 text-center dark:border-zinc-700">
      {icon && <div className="mb-3 text-zinc-400 [&>svg]:size-8">{icon}</div>}
      <h3 className="text-sm font-semibold">{title}</h3>
      {children && <div className="mt-1.5 max-w-md text-sm text-zinc-500 dark:text-zinc-400">{children}</div>}
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-2">{actions}</div>}
    </div>
  )
}

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
        {description && <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
