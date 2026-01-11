"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { isInWishlist, toggleWishlist } from "@/lib/wishlist"
import { useRouter } from "next/navigation"

interface WishlistButtonProps {
  productId: string
  size?: "default" | "sm" | "lg" | "icon"
  variant?: "default" | "outline" | "ghost"
  className?: string
  showText?: boolean
}

export function WishlistButton({
  productId,
  size = "icon",
  variant = "outline",
  className = "",
  showText = false,
}: WishlistButtonProps) {
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)

      if (user) {
        const inWishlist = await isInWishlist(productId)
        setIsWishlisted(inWishlist)
      }
    }

    checkAuth()
  }, [productId])

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      router.push("/auth/login")
      return
    }

    setLoading(true)
    const result = await toggleWishlist(productId)
    if (result.success) {
      setIsWishlisted(result.added)
    }
    setLoading(false)
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={`${className} ${isWishlisted ? "text-pop-pink border-pop-pink hover:text-pop-pink" : ""} bg-transparent`}
      onClick={handleToggle}
      disabled={loading}
    >
      <Heart className={`h-5 w-5 ${isWishlisted ? "fill-pop-pink" : ""}`} />
      {showText && <span className="ml-2">{isWishlisted ? "Saved" : "Save"}</span>}
    </Button>
  )
}
