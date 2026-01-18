import { SignUp } from "@clerk/nextjs"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function SignUpPage() {
    return (
        <main className="min-h-screen bg-background">
            <Header />
            <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-6 py-12">
                <SignUp
                    appearance={{
                        elements: {
                            rootBox: "mx-auto",
                            card: "shadow-xl border-0",
                        }
                    }}
                    routing="path"
                    path="/sign-up"
                    signInUrl="/sign-in"
                />
            </div>
            <Footer />
        </main>
    )
}
