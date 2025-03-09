"use client"

import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Message } from "@/lib/types"
import { User } from "lucide-react"

interface MessageListProps {
  messages: Message[]
  currentUserId: string
}

export default function MessageList({ messages, currentUserId }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  // Group messages by date
  const groupedMessages: { [date: string]: Message[] } = {}

  messages.forEach((message) => {
    const date = new Date(message.createdAt).toLocaleDateString()
    if (!groupedMessages[date]) {
      groupedMessages[date] = []
    }
    groupedMessages[date].push(message)
  })

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-6">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date} className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-2 text-xs text-gray-500">
                  {date === new Date().toLocaleDateString() ? "Today" : date}
                </span>
              </div>
            </div>

            {dateMessages.map((message) => {
              const isCurrentUser = message.senderId === currentUserId

              return (
                <div
                  key={message.id}
                  className={cn("flex items-end space-x-2", isCurrentUser ? "justify-end" : "justify-start")}
                >
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={cn(
                      "max-w-md rounded-lg px-4 py-2 shadow-sm",
                      isCurrentUser ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-900",
                    )}
                  >
                    {message.imageUrl && (
                      <img
                        src={message.imageUrl || "/placeholder.svg"}
                        alt="Message attachment"
                        className="mb-2 rounded-md max-w-full max-h-60 object-contain"
                      />
                    )}
                    {message.content && <p>{message.content}</p>}
                    <span
                      className={cn(
                        "block text-xs mt-1",
                        isCurrentUser ? "text-primary-foreground/80" : "text-gray-500",
                      )}
                    >
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={scrollRef} />
      </div>
    </ScrollArea>
  )
}

