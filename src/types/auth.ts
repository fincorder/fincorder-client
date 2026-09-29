export interface AuthUser {
  id: string
  name: string
  status: string
  email?: string
  review_transactions?: boolean
  timezone?: string
  avatar_url?: string | null
}

export interface AuthSession extends AuthUser {
  access_token: string
  token_type: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}
