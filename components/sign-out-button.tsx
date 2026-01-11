"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors w-full text-left text-destructive"
    >
      <LogOut className="h-4 w-4" />
      <span className="text-sm font-medium">Sign out</span>
    </button>
  )
}
