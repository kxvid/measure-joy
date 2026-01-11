import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams
  const errorMessage = params?.error || params?.message

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-xl text-center">
            <CardHeader className="pb-2">
              <div className="w-14 h-14 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {errorMessage ? (
                <p className="text-sm text-muted-foreground">{errorMessage}</p>
              ) : (
                <p className="text-sm text-muted-foreground">An unspecified error occurred during authentication.</p>
              )}
              <div className="flex gap-3 justify-center">
                <Button asChild variant="outline" className="rounded-xl bg-transparent">
                  <Link href="/auth/login">Try again</Link>
                </Button>
                <Button asChild className="rounded-xl">
                  <Link href="/">Return to store</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </main>
  )
}
