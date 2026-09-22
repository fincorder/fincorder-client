import { apiRequest } from './client'
import type { AuthSession, RegisterPayload, LoginPayload, AuthUser } from '../../types/auth'

export function login(payload: LoginPayload) {
  return apiRequest<AuthSession>('/auth/login', { method: 'POST', body: JSON.stringify(payload) })
}

export function register(payload: RegisterPayload) {
  return apiRequest<AuthUser>('/auth/register', { method: 'POST', body: JSON.stringify(payload) })
}

export function getMe() {
  return apiRequest<AuthUser>('/auth/me')
}

export function updateProfile(name: string) {
  return apiRequest<AuthUser>('/auth/me', { method: 'PATCH', body: JSON.stringify({ name }) })
}

export function logout() {
  return apiRequest<{ message: string }>('/auth/logout', { method: 'POST' })
}
