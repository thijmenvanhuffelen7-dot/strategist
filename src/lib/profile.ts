import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from './db'
import type { Profile } from './types'

const DEFAULT_PROFILE: Profile = {
  id: 'profile',
  naam: null,
  standaard_taal: 'Nederlands',
  standaard_platform: 'Meta',
  drempels: { hook_rate: 30, hold_rate: 10, ctr: 1, cpa: 30, roas: 2 },
  tag_lijsten: {},
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => ({ ...DEFAULT_PROFILE, ...(await db.get<Profile>('meta', 'profile')) }),
  })
}

export function useUpdateProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (values: Partial<Profile>) => {
      const current = { ...DEFAULT_PROFILE, ...(await db.get<Profile>('meta', 'profile')) }
      await db.put('meta', { ...current, ...values, id: 'profile' })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}
