import { apiRequest } from './client'
import type { Conversation } from '../../types/conversations'

export function getConversations() {
  return apiRequest<Conversation[]>('/conversations')
}

export function createConversation(title = 'New Chat') {
  return apiRequest<Conversation>('/conversations', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
}

export function updateConversation(conversationId: string, title: string) {
  return apiRequest<Conversation>(`/conversations/${conversationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })
}

export function archiveConversation(conversationId: string) {
  return apiRequest<Conversation>(`/conversations/${conversationId}/archive`, {
    method: 'PATCH',
  })
}
