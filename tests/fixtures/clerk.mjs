export async function currentUser() { return globalThis.formTestUser ?? null }
export async function auth() { return { userId: globalThis.formTestUser?.id ?? null } }
