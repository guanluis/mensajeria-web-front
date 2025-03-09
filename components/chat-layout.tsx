"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, LogOut, Send, ImageIcon, User, MessageCircle } from "lucide-react"
import ContactList from "./contact-list"
import MessageList from "./message-list"
import { useContactStore } from "@/lib/stores/contact-store"
import { useMessageStore } from "@/lib/stores/message-store"
import { fetchContacts, fetchMessages, sendMessage } from "@/lib/api"

interface ChatLayoutProps {
  userId: string
}

export default function ChatLayout({ userId }: ChatLayoutProps) {
  const [loading, setLoading] = useState(true)
  const [messageInput, setMessageInput] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const { contacts, setContacts, selectedContactId, setSelectedContactId } = useContactStore()
  const { messages, setMessages, addMessage } = useMessageStore()

  // Load contacts
  useEffect(() => {
    const loadContacts = async () => {
      try {
        const contactsData = await fetchContacts()
        setContacts(contactsData)
        setLoading(false)
      } catch (error) {
        console.error("Error loading contacts:", error)
        toast({
          title: "Error",
          description: "Failed to load contacts",
          variant: "destructive",
        })
        setLoading(false)
      }
    }

    loadContacts()
  }, [setContacts, toast])

  // Load messages when a contact is selected
  useEffect(() => {
    if (selectedContactId) {
      const loadMessages = async () => {
        try {
          const messagesData = await fetchMessages(selectedContactId)
          setMessages(messagesData)
        } catch (error) {
          console.error("Error loading messages:", error)
          toast({
            title: "Error",
            description: "Failed to load messages",
            variant: "destructive",
          })
        }
      }

      loadMessages()
    }
  }, [selectedContactId, setMessages, toast])

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!selectedContactId) return

    const channel = supabase
      .channel(`messages:${selectedContactId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedContactId}`,
        },
        (payload) => {
          // Only add the message if it's not from the current user
          if (payload.new.sender_id !== userId) {
            addMessage(payload.new)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, selectedContactId, userId, addMessage])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !imageFile) || !selectedContactId) return

    try {
      let imageUrl = null

      // Upload image if present
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop()
        const fileName = `${userId}-${Date.now()}.${fileExt}`

        const { data, error } = await supabase.storage.from("message-images").upload(fileName, imageFile)

        if (error) throw error

        const { data: urlData } = supabase.storage.from("message-images").getPublicUrl(fileName)

        imageUrl = urlData.publicUrl
      }

      const newMessage = await sendMessage({
        conversationId: selectedContactId,
        senderId: userId,
        content: messageInput,
        imageUrl,
      })

      addMessage(newMessage)
      setMessageInput("")
      setImageFile(null)
      setImagePreview(null)
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const selectedContact = contacts.find((contact) => contact.id === selectedContactId)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Avatar>
              <AvatarFallback>
                <User className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">ChatApp</h2>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>

        <div className="p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search contacts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ContactList
              contacts={contacts.filter((contact) => contact.name.toLowerCase().includes(searchQuery.toLowerCase()))}
              selectedContactId={selectedContactId}
              onSelectContact={setSelectedContactId}
            />
          )}
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="hidden md:flex flex-col flex-1">
        {selectedContactId ? (
          <>
            <div className="p-4 border-b border-gray-200 flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={selectedContact?.avatar} />
                <AvatarFallback>{selectedContact?.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold">{selectedContact?.name}</h2>
                <p className="text-sm text-gray-500">{selectedContact?.status || "Online"}</p>
              </div>
            </div>

            <MessageList messages={messages} currentUserId={userId} />

            {imagePreview && (
              <div className="p-2 border-t border-gray-200">
                <div className="relative inline-block">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Upload preview"
                    className="h-20 rounded-md object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                  >
                    ×
                  </Button>
                </div>
              </div>
            )}

            <div className="p-4 border-t border-gray-200 flex items-center space-x-2">
              <Button variant="outline" size="icon" className="shrink-0" asChild>
                <label>
                  <ImageIcon className="h-5 w-5" />
                  <input type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                  <span className="sr-only">Attach image</span>
                </label>
              </Button>
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              <Button size="icon" className="shrink-0" onClick={handleSendMessage}>
                <Send className="h-5 w-5" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="bg-gray-100 p-6 rounded-full inline-flex items-center justify-center mb-4">
                <MessageCircle className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium">Select a contact</h3>
              <p className="text-gray-500 mt-1">Choose a contact to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

