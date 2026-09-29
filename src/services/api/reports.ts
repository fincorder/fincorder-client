import { apiRequest } from './client'
import type { ReportData, ReportFilters, ReportName, ReportOptions } from '../../types/reports'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

function query(filters: ReportFilters) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value))
  })
  return params.toString()
}

export function getReport(view: ReportName, filters: ReportFilters) {
  return apiRequest<ReportData>(`/reports/${view}?${query(filters)}`)
}

export function getReportOptions() {
  return apiRequest<ReportOptions>('/reports/options')
}

export async function exportReport(view: ReportName, filters: ReportFilters, filename = view) {
  const token = localStorage.getItem('fincorder_access_token')
  const response = await fetch(`${API_URL}/reports/export?view=${view}&${query(filters)}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { detail?: string }
    throw new Error(body.detail || 'Could not export this report.')
  }
  const url = URL.createObjectURL(await response.blob())
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `fincorder-${filename}.csv`
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
