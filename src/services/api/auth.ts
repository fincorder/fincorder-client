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

export function updateProfile(name?: string, preferences?: { review_transactions?: boolean; timezone?: string }) {
  return apiRequest<AuthUser>('/auth/me', { method: 'PATCH', body: JSON.stringify({ name, ...preferences }) })
}

export function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<AuthUser>('/auth/me/avatar', { method: 'POST', body: form })
}

export function removeAvatar() {
  return apiRequest<AuthUser>('/auth/me/avatar', { method: 'DELETE' })
}

export function logout() {
  return apiRequest<{ message: string }>('/auth/logout', { method: 'POST' })
}
