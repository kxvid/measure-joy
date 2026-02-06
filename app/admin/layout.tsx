import Link from "next/link"
import { Home, LayoutDashboard, Package, ShoppingCart, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
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
        </div >
    )
}
