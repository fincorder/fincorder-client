import { apiRequest } from './client'
import type { Account, Category, CategoryType, Person } from '../../types/resources'

export function getAccounts() { return apiRequest<Account[]>('/accounts') }
export function createAccount(name: string, currency: string, isDefault = false) { return apiRequest<Account>('/accounts', { method: 'POST', body: JSON.stringify({ name, currency, is_default: isDefault }) }) }
export function updateAccount(id: string, payload: { name?: string; currency?: string; is_default?: boolean }) { return apiRequest<Account>(`/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }) }
export function deleteAccount(id: string) { return apiRequest<void>(`/accounts/${id}`, { method: 'DELETE' }) }

export function getPeople() { return apiRequest<Person[]>('/people') }
export function createPerson(name: string) { return apiRequest<Person>('/people', { method: 'POST', body: JSON.stringify({ name }) }) }
export function updatePerson(id: string, name: string) { return apiRequest<Person>(`/people/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }) }
export function deletePerson(id: string) { return apiRequest<void>(`/people/${id}`, { method: 'DELETE' }) }

export function getCategories() { return apiRequest<Category[]>('/categories') }
export function createCategory(name: string, type: CategoryType) { return apiRequest<Category>('/categories', { method: 'POST', body: JSON.stringify({ name, type }) }) }
export function updateCategory(id: string, name: string) { return apiRequest<Category>(`/categories/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }) }
export function deleteCategory(id: string) { return apiRequest<void>(`/categories/${id}`, { method: 'DELETE' }) }
