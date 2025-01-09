import { useQuery } from '@tanstack/react-query'
import { fetcher } from './utils'

export type DataEntry = {
  timestamp: number,
  value: number
}

export type DataRange = {
  min?: number | null,
  max?: number | null
}

export const useEntries = () => useQuery({
  queryKey: [ 'entries' ],
  queryFn: () => fetcher<string[]>(`/api/entries`)
})

export const useEntryData = (name: string) => useQuery({
  queryKey: [ 'data', name ],
  queryFn: () => fetcher<DataEntry[]>(`/api/entries/${name}`)
})

export const useEntryRange = (name: string) => {
  return useQuery({
    queryKey: [ 'range', name ],
    queryFn: () => fetcher<DataRange>(`/api/ranges/${name}`)
  })
}