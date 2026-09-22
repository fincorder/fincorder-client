export interface Account {
  id: string
  name: string
  currency: string
  is_active: boolean
  is_default: boolean
}

export interface Person {
  id: string
  name: string
}

export type CategoryType = 'expense' | 'income'

export interface Category {
  id: string
  name: string
  type: CategoryType
}
