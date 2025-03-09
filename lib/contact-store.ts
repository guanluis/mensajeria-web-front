import { create } from "zustand"
import type { Contact } from "@/lib/types"

interface ContactState {
  contacts: Contact[]
  selectedContactId: string | null
  setContacts: (contacts: Contact[]) => void
  setSelectedContactId: (id: string) => void
  updateContact: (id: string, data: Partial<Contact>) => void
}

export const useContactStore = create<ContactState>((set) => ({
  contacts: [],
  selectedContactId: null,
  setContacts: (contacts) => set({ contacts }),
  setSelectedContactId: (id) => set({ selectedContactId: id }),
  updateContact: (id, data) =>
    set((state) => ({
      contacts: state.contacts.map((contact) => (contact.id === id ? { ...contact, ...data } : contact)),
    })),
}))

