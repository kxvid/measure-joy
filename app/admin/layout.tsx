import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Home, LayoutDashboard, Package, ShoppingCart, Wand2, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { verifyAdminCode } from "@/app/actions/auth-admin"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const isAuth = cookieStore.get("admin_access")?.value === "true"

    if (!isAuth) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-muted/20">
                <div className="max-w-md w-full p-8 bg-background border rounded-xl shadow-sm">
                    <div className="flex flex-col items-center mb-6">
                        <div className="h-12 w-12 bg-pop-pink/10 rounded-full flex items-center justify-center mb-4">
                            <Lock className="h-6 w-6 text-pop-pink" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Admin Access</h1>
                        <p className="text-muted-foreground text-center mt-2 text-sm">
                            Enter the access code to manage Measure Joy.
                        </p>
                    </div>

                    <form action={async (formData) => {
                        "use server"
                        const result = await verifyAdminCode(formData)
                        if (result.success) {
                            redirect("/admin/orders")
                        }
                    }}>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Access Code</Label>
                                <Input
                                    id="code"
                                    name="code"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">
                                Unlock Dashboard
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex flex-col">
            <header className="border-b h-14 flex items-center px-4 gap-4 bg-background sticky top-0 z-50">
                {/* Home/Account Redirect as requested */}
                <Button variant="ghost" size="icon" asChild className="mr-2">
                    <Link href="/account" title="Back to Account">
                        <Home className="h-5 w-5" />
                        <span className="sr-only">Back to Account</span>
                    </Link>
                </Button>

                <div className="flex items-center gap-1 font-semibold text-lg">
                    <LayoutDashboard className="h-5 w-5 mr-2" />
                    Admin
                </div>

                <nav className="ml-6 flex items-center gap-6 text-sm font-medium text-muted-foreground">
                    <Link href="/admin/orders" className="flex items-center gap-2 hover:text-foreground transition-colors">
                        <ShoppingCart className="h-4 w-4" />
                        Orders
                    </Link>
                    <Link href="/admin/categories" className="flex items-center gap-2 hover:text-foreground transition-colors">
                        <Package className="h-4 w-4" />
                        Categories
                    </Link>
                    <Link href="/admin/products" className="flex items-center gap-2 hover:text-foreground transition-colors">
                        <Wand2 className="h-4 w-4" />
                        Data Tools
                    </Link>
                </nav>
            </header>
            <main className="flex-1 bg-muted/10">
                {children}
            </main>
        </div>
    )
}
