'use client'
import { SWIPE_PLATFORMS, TAG_VELDEN, type SwipeTags } from '@/lib/builder-types'
import { AutoTextarea } from '../AutoTextarea'

export interface SwipeWaarden {
  titel: string
  merk: string
  platform: string
  url: string
  transcript: string
  notities: string
  tags: SwipeTags
}

/** Gedeelde invoervelden voor een swipe-item (nieuw en bewerken). */
export function SwipeVelden({ v, onChange }: { v: SwipeWaarden; onChange: (patch: Partial<SwipeWaarden>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="swipe-titel">Titel *</label>
          <input id="swipe-titel" className="input" value={v.titel} placeholder="Bijv. Hims – POV haaruitval UGC" onChange={(e) => onChange({ titel: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="swipe-merk">Merk</label>
          <input id="swipe-merk" className="input" value={v.merk} onChange={(e) => onChange({ merk: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="swipe-platform">Platform</label>
          <input id="swipe-platform" className="input" list="swipe-platforms" value={v.platform} onChange={(e) => onChange({ platform: e.target.value })} />
          <datalist id="swipe-platforms">
            {SWIPE_PLATFORMS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="swipe-url">Link naar de ad</label>
          <input id="swipe-url" className="input" type="url" placeholder="https://www.facebook.com/ads/library/…" value={v.url} onChange={(e) => onChange({ url: e.target.value })} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="swipe-transcript">Transcript / script</label>
        <AutoTextarea
          id="swipe-transcript"
          className="input min-h-28 text-sm leading-relaxed"
          placeholder="Wat wordt er gezegd en wat staat er in beeld? Hoe vollediger, hoe beter de analyse."
          value={v.transcript}
          onChange={(e) => onChange({ transcript: e.target.value })}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {TAG_VELDEN.map(({ key, label, opties }) => (
          <div key={key}>
            <label className="label" htmlFor={`tag-${key}`}>{label}</label>
            <input id={`tag-${key}`} className="input text-sm" list={`lijst-${key}`} value={v.tags[key] ?? ''} onChange={(e) => onChange({ tags: { ...v.tags, [key]: e.target.value } })} />
            <datalist id={`lijst-${key}`}>
              {opties.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>
        ))}
      </div>
      <div>
        <label className="label" htmlFor="swipe-notities">Eigen notities</label>
        <AutoTextarea id="swipe-notities" className="input text-sm leading-relaxed" value={v.notities} onChange={(e) => onChange({ notities: e.target.value })} />
      </div>
    </div>
  )
}
