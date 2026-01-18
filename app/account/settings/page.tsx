"use client"

import { UserProfile } from "@clerk/nextjs"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-4xl px-6 lg:px-8 py-8 lg:py-12">
        <Link
          href="/account"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Account
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account settings</p>
        </div>

        <div className="flex justify-center">
          <UserProfile routing="hash" />
        </div>
      </div>

      <Footer />
    </main>
  )
}
