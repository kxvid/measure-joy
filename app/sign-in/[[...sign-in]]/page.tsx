import { SignIn } from "@clerk/nextjs"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function SignInPage() {
    return (
        <main className="min-h-screen bg-background">
            <Header />
            <div className="flex min-h-[calc(100vh-200px)] w-full items-center justify-center px-6 py-12">
                <SignIn
                    appearance={{
                        elements: {
                            rootBox: "mx-auto",
                            card: "shadow-xl border-0",
                        }
                    }}
                    routing="path"
                    path="/sign-in"
                    signUpUrl="/sign-up"
                />
            </div>
            <Footer />
        </main>
    )
}
