import { auth, currentUser } from "@clerk/nextjs/server"

export default async function TestAuthPage() {
    const user = await currentUser()
    const session = await auth()

    return (
        <div className="p-8 font-mono space-y-4">
            <h1 className="text-xl font-bold">Auth Debugger</h1>

            <div className="bg-gray-100 p-4 rounded">
                <h2 className="font-bold">User Metadata</h2>
                <pre>{JSON.stringify(user?.publicMetadata, null, 2)}</pre>
            </div>

            <div className="bg-gray-100 p-4 rounded">
                <h2 className="font-bold">Session Claims</h2>
                <pre>{JSON.stringify(session.sessionClaims, null, 2)}</pre>
            </div>

            <div className="bg-gray-100 p-4 rounded">
                <h2 className="font-bold">Roles</h2>
                <pre>{JSON.stringify((session.sessionClaims?.metadata as any)?.role, null, 2)}</pre>
            </div>

            <div className="bg-gray-100 p-4 rounded">
                <h2 className="font-bold">User ID</h2>
                <pre>{user?.id}</pre>
            </div>
        </div>
    )
}
