
export const fetcher = <T>(input: string | URL | globalThis.Request, init?: RequestInit): Promise<T> => {
  return fetch(input, init)
    .then(res => {
      if(!res.ok)
        throw new Error(`Server responded with ${res.status} (${res.statusText})`)
      return res.json() as T
    })
}