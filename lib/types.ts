export interface Contact {
  id: string
  name: string
  avatar?: string
  status?: string
  lastMessage?: string
  lastMessageTime?: string
  unreadCount?: number
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  content?: string
  imageUrl?: string | null
  createdAt: string
}

