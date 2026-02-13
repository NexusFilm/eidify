import { useState, useRef, useEffect } from "react"
import { Send, Bot, User, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { ScrollArea } from "./ui/scroll-area"
import { cn } from "@/lib/utils"

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  command?: {
    intent: string
    target?: string
    parameters?: Record<string, any>
  }
}

interface ChatPanelProps {
  onSendMessage: (message: string) => Promise<void>
  messages: ChatMessage[]
  isProcessing?: boolean
  className?: string
}

export default function ChatPanel({
  onSendMessage,
  messages,
  isProcessing = false,
  className,
}: ChatPanelProps) {
  const [input, setInput] = useState("")
  const [isExpanded, setIsExpanded] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const message = input.trim()
    setInput("")
    await onSendMessage(message)
  }

  const quickActions = [
    "Remove the background",
    "Make it brighter",
    "Remove the person on the left",
    "Upscale 2x",
  ]

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg transition-all duration-300 z-30",
        isExpanded ? "h-[400px]" : "h-[60px]",
        className
      )}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b cursor-pointer hover:bg-accent/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">
              Describe your edits in natural language
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </Button>
      </div>

      {/* Chat Content */}
      {isExpanded && (
        <div className="flex flex-col h-[calc(100%-60px)]">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Bot className="w-12 h-12 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try asking me to edit your image
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {quickActions.map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInput(action)
                      }}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isProcessing && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 bg-muted rounded-lg p-3">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe what you want to edit..."
                disabled={isProcessing}
                className="flex-1"
              />
              <Button type="submit" disabled={!input.trim() || isProcessing}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

function ChatMessage({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-primary" : "bg-gradient-to-br from-primary to-accent"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>
      <div className={cn("flex-1 max-w-[80%]", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-lg p-3",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          {message.command && (
            <div className="mt-2 pt-2 border-t border-border/50">
              <p className="text-xs opacity-70">
                Command: {message.command.intent}
                {message.command.target && ` → ${message.command.target}`}
              </p>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1 px-1">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  )
}
