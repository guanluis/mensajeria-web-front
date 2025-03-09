"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Contact } from "@/lib/types"

interface ContactListProps {
  contacts: Contact[]
  selectedContactId: string | null
  onSelectContact: (id: string) => void
}

export default function ContactList({ contacts, selectedContactId, onSelectContact }: ContactListProps) {
  return (
    <div className="divide-y divide-gray-200">
      {contacts.length === 0 ? (
        <div className="p-4 text-center text-gray-500">No contacts found</div>
      ) : (
        contacts.map((contact) => (
          <div
            key={contact.id}
            className={cn(
              "flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-50",
              selectedContactId === contact.id && "bg-gray-100",
            )}
            onClick={() => onSelectContact(contact.id)}
          >
            <Avatar>
              <AvatarImage src={contact.avatar} />
              <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h3 className="text-sm font-medium truncate">{contact.name}</h3>
                {contact.lastMessageTime && (
                  <span className="text-xs text-gray-500">
                    {new Date(contact.lastMessageTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                )}
              </div>
              {contact.lastMessage && <p className="text-xs text-gray-500 truncate">{contact.lastMessage}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

