'use client'
import { ImageIcon, Film } from 'lucide-react'

/** Toont een screenshot of video, of een lege plek. */
export function Media({ link, type, className = '', bediening = false }: { link: string | null; type: string | null; className?: string; bediening?: boolean }) {
  if (!link)
    return (
      <div className={`flex items-center justify-center bg-zinc-100 text-zinc-300 dark:bg-zinc-800 dark:text-zinc-600 ${className}`}>
        <ImageIcon className="size-8" />
      </div>
    )
  if (type?.startsWith('video/'))
    return bediening ? (
      <video src={link} controls playsInline preload="metadata" className={`bg-black object-contain ${className}`} />
    ) : (
      <div className={`relative bg-black ${className}`}>
        <video src={`${link}#t=0.5`} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        <Film className="absolute right-2 bottom-2 size-4 text-white drop-shadow" />
      </div>
    )
  // eslint-disable-next-line @next/next/no-img-element -- privé-media via ondertekende links; next/image voegt hier niets toe
  return <img src={link} alt="" loading="lazy" className={`object-cover ${className}`} />
}
