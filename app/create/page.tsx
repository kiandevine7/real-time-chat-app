"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createChatSession } from "@/lib/actions"
import QRCode from "qrcode.react"
import { io } from "socket.io-client"
import { useRouter } from "next/navigation"
import { ChatInterface } from "@/components/chat-interface"
import { Download, Users } from "lucide-react"
import { jsPDF } from "jspdf"

export default function CreateChat() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [joinCode, setJoinCode] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [participants, setParticipants] = useState<number>(0)
  const [socket, setSocket] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const initSession = async () => {
      const { sessionId, joinCode } = await createChatSession()
      setSessionId(sessionId)
      setJoinCode(joinCode)

      // Connect to socket server
      const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
        query: { sessionId, role: "presenter" },
      })

      socketInstance.on("message", (message) => {
        setMessages((prev) => [...prev, message])
      })

      socketInstance.on("participantCount", (count) => {
        setParticipants(count)
      })

      setSocket(socketInstance)
    }

    initSession()

    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [])

  const handleSendMessage = (content: string) => {
    if (socket && content.trim()) {
      const message = {
        id: Date.now().toString(),
        content,
        sender: "Presenter",
        timestamp: new Date().toISOString(),
        role: "presenter",
      }
      socket.emit("message", message)
      setMessages((prev) => [...prev, message])
    }
  }

  const handleEndSession = () => {
    if (socket) {
      socket.emit("endSession")
      router.push("/")
    }
  }

  const exportToPDF = () => {
    const doc = new jsPDF()

    // Add title
    doc.setFontSize(18)
    doc.text("Chat Session Export", 20, 20)

    // Add session info
    doc.setFontSize(12)
    doc.text(`Session ID: ${sessionId}`, 20, 30)
    doc.text(`Join Code: ${joinCode}`, 20, 40)
    doc.text(`Participants: ${participants}`, 20, 50)

    // Add messages
    doc.setFontSize(10)
    let yPos = 70

    messages.forEach((msg) => {
      const timestamp = new Date(msg.timestamp).toLocaleTimeString()
      doc.text(`${timestamp} - ${msg.sender}: ${msg.content}`, 20, yPos)
      yPos += 10

      // Add new page if needed
      if (yPos > 280) {
        doc.addPage()
        yPos = 20
      }
    })

    doc.save(`chat-session-${joinCode}.pdf`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <div className="flex flex-1 flex-col md:flex-row">
        <div className="flex flex-col items-center justify-center p-4 md:w-1/3 bg-white border-r">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Presenter Dashboard
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users size={14} />
                  {participants}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              {joinCode && (
                <>
                  <div className="text-center">
                    <h3 className="font-semibold">Join Code</h3>
                    <p className="text-2xl font-bold tracking-wider">{joinCode}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg">
                    <QRCode
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/join?code=${joinCode}`}
                      size={200}
                      level="H"
                    />
                  </div>
                </>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleEndSession}>
                End Session
              </Button>
              <Button onClick={exportToPDF} className="flex items-center gap-2">
                <Download size={16} />
                Export PDF
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="flex-1 p-4">
          <ChatInterface messages={messages} onSendMessage={handleSendMessage} role="presenter" />
        </div>
      </div>
    </div>
  )
}

