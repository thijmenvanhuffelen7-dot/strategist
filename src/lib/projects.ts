import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('bijgewerkt_op', { ascending: false })
      if (error) throw error
      return data as Project[]
    },
  })
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('*').eq('id', id!).single()
      if (error) throw error
      return data as Project
    },
  })
}

export function useSaveProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: ProjectInput }) => {
      const query = id
        ? supabase.from('projects').update(values).eq('id', id)
        : supabase.from('projects').insert(values)
      const { data, error } = await query.select().single()
      if (error) throw error
      return data as Project
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useLoadSampleProject() {
  const save = useSaveProject()
  return {
    ...save,
    mutateAsync: () => save.mutateAsync({ values: voorbeeldProject }),
  }
}
