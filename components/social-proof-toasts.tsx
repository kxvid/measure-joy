"use client"

import { useState, useEffect } from "react"
import { X, ShoppingBag, MapPin } from "lucide-react"
import { type Product } from "@/lib/products"

// Sample locations for social proof
const locations = [
    "San Francisco, CA",
    "New York, NY",
    "Los Angeles, CA",
    "Austin, TX",
    "Seattle, WA",
    "Portland, OR",
    "Chicago, IL",
    "Miami, FL",
    "Denver, CO",
    "Boston, MA",
    "Toronto, ON",
    "Vancouver, BC",
    "London, UK",
    "Sydney, AU",
]

// Time ago strings
const timeAgos = [
    "just now",
    "2 minutes ago",
    "5 minutes ago",
    "8 minutes ago",
    "12 minutes ago",
]

interface SaleToast {
    id: string
    product: Product
    location: string
    timeAgo: string
}

export function SocialProofToasts() {
    return null // Disabled as requested
}
