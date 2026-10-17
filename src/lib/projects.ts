import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db, newId } from './db'
import type { Project, ProjectInput } from './types'
import { voorbeeldProject } from './sampleData'

const KEY = ['projects']

export function emptyProject(taal = 'Nederlands', platform?: string): ProjectInput {
  return {
    naam: '',
    omschrijving: '',
    prijs: '',
    url: '',
    landingspagina_tekst: '',
    doelgroep: '',
    platforms: platform ? [platform as ProjectInput['platforms'][number]] : [],
    doel: 'cold_traffic',
    taal,
    concurrenten: [],
    klantdata: '',
    drempels: {},
    is_voorbeeld: false,
  }
}

export function useProjects() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const all = await db.list<Project>('projects')
      return all.sort((a, b) => b.bijgewerkt_op.localeCompare(a.bijgewerkt_op))
    },
  })
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const p = await db.get<Project>('projects', id!)
      if (!p) throw new Error('Project niet gevonden')
      return p
    },
  })
}

export function useSaveProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: ProjectInput }) => {
      const now = new Date().toISOString()
      const existing = id ? await db.get<Project>('projects', id) : undefined
      return db.put<Project>('projects', {
        ...values,
        id: existing?.id ?? newId(),
        aangemaakt_op: existing?.aangemaakt_op ?? now,
        bijgewerkt_op: now,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => db.removeProject(id),
    onSuccess: (_, id) => {
      qc.setQueryData<Project[]>(KEY, (old) => old?.filter((p) => p.id !== id))
      qc.removeQueries({ queryKey: [...KEY, id] })
      return qc.invalidateQueries()
    },
  })
}

export function useLoadSampleProject() {
  const save = useSaveProject()
  return {
    ...save,
    mutateAsync: () => save.mutateAsync({ values: voorbeeldProject }),
  }
}
