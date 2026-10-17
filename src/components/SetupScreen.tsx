export function SetupScreen() {
  return (
    <div className="flex min-h-full items-center justify-center px-4">
      <div className="card max-w-lg p-6 text-sm leading-relaxed">
        <h1 className="mb-2 text-base font-semibold">Supabase is nog niet gekoppeld</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Maak een bestand <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.local</code> in de projectmap (zie{' '}
          <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">.env.example</code>) met:
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
{`VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
        </pre>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">Herstart daarna de dev-server. Zie README.md voor alle stappen.</p>
      </div>
    </div>
  )
}
