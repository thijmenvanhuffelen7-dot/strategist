import { useEffect, useRef } from 'react'

export function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

/** Sneltoets "N": pagina's registreren hun eigen "nieuw item"-actie. De laatst geregistreerde wint. */
const newHandlers: Array<() => void> = []

export function triggerNew(fallback: () => void) {
  const handler = newHandlers[newHandlers.length - 1]
  ;(handler ?? fallback)()
}

export function useNewShortcut(handler: () => void) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    const fn = () => ref.current()
    newHandlers.push(fn)
    return () => {
      const i = newHandlers.indexOf(fn)
      if (i >= 0) newHandlers.splice(i, 1)
    }
  }, [])
}
