export type ConversationStatus = 'active' | 'archived'

export interface Conversation {
  id: string
  title: string | null
  status: ConversationStatus
}
