import { headers } from "next/headers"
import Link from "next/link"
import {
    Home,
    LayoutDashboard,
    Package,
    ShoppingCart,
    Wand2,
    Lock,
    FileEdit,
    LogOut,
    Pencil,
    Boxes,
    ShieldAlert,
} from "lucide-react"
import { SignOutButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { getAdminStatus } from "@/app/actions/auth-admin"

const NAV_ITEMS = [
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/inventory", label: "Inventory", icon: Boxes },
    { href: "/admin/categories", label: "Categories", icon: Package },
    { href: "/admin/content", label: "Site Content", icon: FileEdit },
    { href: "/admin/copywriter", label: "AI Copywriter", icon: Pencil },
    { href: "/admin/products", label: "Data Tools", icon: Wand2 },
]

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { isAdmin, isSignedIn, email } = await getAdminStatus()

    // Middleware ensures isSignedIn is true by the time we render. If it's not,
    // Clerk has already redirected — but guard defensively anyway.
    if (!isSignedIn) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/20 p-8">
                <div className="max-w-md w-full p-8 bg-background border rounded-xl shadow-sm text-center">
                    <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
                    <h1 className="text-2xl font-bold">Sign in required</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        You need to be signed in to access the admin dashboard.
                    </p>
                    <Button asChild className="mt-6">
                        <Link href="/sign-in?redirect_url=/admin/orders">Sign in</Link>
                    </Button>
                </div>
            </div>
        )
    }

    // Signed in but not on the allowlist — show a clear "no access" screen
    // with sign-out so they can switch accounts.
    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/20 p-8">
                <div className="max-w-md w-full p-8 bg-background border rounded-xl shadow-sm text-center">
                    <div className="h-12 w-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldAlert className="h-6 w-6 text-destructive" />
                    </div>
                    <h1 className="text-2xl font-bold">Access denied</h1>
                    <p className="text-muted-foreground mt-2 text-sm">
                        {email
                            ? <>Your account (<span className="font-mono">{email}</span>) is not an admin.</>
                            : "This account is not authorized."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-3">
                        If this is a mistake, ask the owner to add your email to ADMIN_EMAILS.
                    </p>
                    <div className="flex gap-2 mt-6">
                        <Button variant="outline" asChild className="flex-1">
                            <Link href="/">Back to store</Link>
                        </Button>
                        <SignOutButton redirectUrl="/sign-in?redirect_url=/admin/orders">
                            <Button className="flex-1 gap-2">
                                <LogOut className="h-4 w-4" />
                                Sign out
                            </Button>
                        </SignOutButton>
                    </div>
                </div>
            </div>
        )
    }

    // Authorized admin — render the dashboard chrome.
    const headersList = await headers()
    const pathname = headersList.get("x-pathname") || headersList.get("x-invoke-path") || ""

    return (
        <div className="min-h-screen flex flex-col">
            <header className="border-b h-14 flex items-center px-4 gap-4 bg-background sticky top-0 z-50">
                <Button variant="ghost" size="icon" asChild className="mr-2">
                    <Link href="/" title="Back to Store">
                        <Home className="h-5 w-5" />
                        <span className="sr-only">Back to Store</span>
                    </Link>
                </Button>

                <div className="flex items-center gap-1 font-semibold text-lg">
                    <LayoutDashboard className="h-5 w-5 mr-2" />
                    Admin
                </div>

                <nav className="ml-6 flex items-center gap-1 text-sm font-medium">
                    {NAV_ITEMS.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
                                    isActive
                                        ? "bg-foreground text-background"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                }`}
                            >
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="ml-auto flex items-center gap-3">
                    {email && (
                        <span className="text-xs text-muted-foreground font-mono hidden md:inline">
                            {email}
                        </span>
                    )}
                    <SignOutButton redirectUrl="/">
                        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </Button>
                    </SignOutButton>
                </div>
            </header>
            <main className="flex-1 bg-muted/10">
                {children}
            </main>
        </div>
    )
}
