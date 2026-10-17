import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from './ui'

interface ConfirmOptions {
  title: string
  message?: ReactNode
  confirmLabel?: string
  danger?: boolean
}

type ConfirmFn = (opts: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

/** Eigen bevestigingsvenster; window.confirm() werkt niet overal (o.a. niet in een ingesloten pagina). */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(null)

  const confirm = useCallback<ConfirmFn>((opts) => new Promise((resolve) => setState({ ...opts, resolve })), [])

  const close = (v: boolean) => {
    state?.resolve(v)
    setState(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && <Dialog {...state} onClose={close} />}
    </ConfirmContext.Provider>
  )
}

function Dialog({ title, message, confirmLabel = 'Bevestigen', danger, onClose }: ConfirmOptions & { onClose: (v: boolean) => void }) {
  const okRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    okRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onMouseDown={() => onClose(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold">{title}</h2>
        {message && <div className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{message}</div>}
        <div className="mt-5 flex justify-end gap-2">
          <Button onClick={() => onClose(false)}>Annuleren</Button>
          <Button ref={okRef} variant={danger ? 'dangerSolid' : 'primary'} onClick={() => onClose(true)}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm buiten ConfirmProvider')
  return ctx
}
