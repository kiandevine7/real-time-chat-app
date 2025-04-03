import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Live Chat App</CardTitle>
          <CardDescription>Create or join a chat session</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Link href="/create" className="w-full">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Create Chat Session</Button>
          </Link>
          <Link href="/join" className="w-full">
            <Button variant="outline" className="w-full">
              Join Chat Session
            </Button>
          </Link>
        </CardContent>
        <CardFooter className="text-center text-sm text-muted-foreground">
          Create a session as a presenter or join as a participant
        </CardFooter>
      </Card>
    </div>
  )
}

