import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl text-center">
            <CardHeader className="pb-2">
              <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="h-7 w-7 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Check your email</CardTitle>
              <CardDescription>We sent you a confirmation link</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Click the link in your email to confirm your account and start shopping for vintage cameras.
              </p>
              <Button asChild variant="outline" className="rounded-xl bg-transparent">
                <Link href="/">Return to store</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </main>
  )
}
