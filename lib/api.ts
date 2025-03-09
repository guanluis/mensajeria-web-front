import type { Contact, Message } from "./types"

// Base URL for the backend API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// Fetch all contacts
export async function fetchContacts(): Promise<Contact[]> {
  const response = await fetch(`${API_BASE_URL}/contacts`)

  if (!response.ok) {
    throw new Error(`Failed to fetch contacts: ${response.statusText}`)
  }

  return response.json()
}

// Search contacts
export async function searchContacts(query: string): Promise<Contact[]> {
  const response = await fetch(`${API_BASE_URL}/contacts/search?q=${encodeURIComponent(query)}`)

  if (!response.ok) {
    throw new Error(`Failed to search contacts: ${response.statusText}`)
  }

  return response.json()
}

// Fetch messages for a conversation
export async function fetchMessages(conversationId: string, page = 1, limit = 50): Promise<Message[]> {
  const response = await fetch(`${API_BASE_URL}/messages/${conversationId}?page=${page}&limit=${limit}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch messages: ${response.statusText}`)
  }

  return response.json()
}

// Send a message
export async function sendMessage(messageData: {
  conversationId: string
  senderId: string
  content?: string
  imageUrl?: string | null
}): Promise<Message> {
  const response = await fetch(`${API_BASE_URL}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(messageData),
  })

  if (!response.ok) {
    throw new Error(`Failed to send message: ${response.statusText}`)
  }

  return response.json()
}

