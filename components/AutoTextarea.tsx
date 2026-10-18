'use client'
import { useLayoutEffect, useRef, type TextareaHTMLAttributes } from 'react'

/** Tekstvak dat meegroeit met de inhoud. */
export function AutoTextarea({ className = '', value, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement> & { value: string }) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight + 2}px`
  }, [value])
  return <textarea ref={ref} rows={1} value={value} className={`resize-none overflow-hidden ${className}`} {...rest} />
}
