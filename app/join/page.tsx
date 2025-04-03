"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { joinChatSession } from "@/lib/actions"
import { ChatInterface } from "@/components/chat-interface"
import { io } from "socket.io-client"
import { Badge } from "@/components/ui/badge"
import { Users } from "lucide-react"

export default function JoinChat() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const codeFromUrl = searchParams.get("code")

  const [joinCode, setJoinCode] = useState(codeFromUrl || "")
  const [username, setUsername] = useState("")
  const [isJoined, setIsJoined] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [participants, setParticipants] = useState<number>(0)
  const [socket, setSocket] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (codeFromUrl) {
      setJoinCode(codeFromUrl)
    }
  }, [codeFromUrl])

  const handleJoin = async () => {
    if (!joinCode.trim()) {
      setError("Please enter a join code")
      return
    }

    try {
      const { sessionId, generatedUsername } = await joinChatSession(joinCode)
      setSessionId(sessionId)
      setUsername(generatedUsername)

      // Connect to socket server
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
        query: { sessionId, username: generatedUsername, role: "participant" },
      })

      socketInstance.on("message", (message) => {
        setMessages((prev) => [...prev, message])
      })

      socketInstance.on("participantCount", (count) => {
        setParticipants(count)
      })

      socketInstance.on("sessionEnded", () => {
        alert("The session has ended by the presenter")
        router.push("/")
      })

      setSocket(socketInstance)
      setIsJoined(true)
      setError(null)
    } catch (err) {
      setError("Invalid join code or session has ended")
    }
  }

  const handleSendMessage = (content: string) => {
    if (socket && content.trim()) {
      const message = {
        id: Date.now().toString(),
        content,
        sender: username,
        timestamp: new Date().toISOString(),
        role: "participant",
      }
      socket.emit("message", message)
      setMessages((prev) => [...prev, message])
    }
  }

  if (!isJoined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Join Chat Session</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Enter Join Code</Label>
              <Input
                id="code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter the 6-digit code"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button onClick={handleJoin} className="w-full">
              Join Session
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <div className="bg-white p-4 border-b flex justify-between items-center">
        <div>
          <h2 className="font-semibold">
            Joined as: <span className="text-blue-600">{username}</span>
          </h2>
          <p className="text-sm text-muted-foreground">Code: {joinCode}</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <Users size={14} />
          {participants}
        </Badge>
      </div>
      <div className="flex-1 p-4">
        <ChatInterface messages={messages} onSendMessage={handleSendMessage} role="participant" />
      </div>
    </div>
  )
}

