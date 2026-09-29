const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export class ApiError extends Error {
  public readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function getErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { detail?: string }
    return data.detail ?? 'Something went wrong. Please try again.'
  } catch {
    return 'Something went wrong. Please try again.'
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('fincorder_access_token')
  const headers = new Headers(options.headers)
  if (options.body instanceof FormData) headers.delete('Content-Type')
  else headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', 'Bearer ' + token)

  const response = await fetch(API_URL + path, { ...options, headers })
  if (!response.ok) throw new ApiError(await getErrorMessage(response), response.status)
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
