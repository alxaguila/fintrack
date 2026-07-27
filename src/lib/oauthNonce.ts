// Nonce para flujos de login "ID token" (Google Identity Services, y en el futuro
// Apple): el valor sin hashear se envía a Supabase (signInWithIdToken), el hasheado
// (SHA-256) se envía al proveedor — evita replay attacks con el mismo ID token.
export async function createIdTokenNonce(): Promise<{ nonce: string; hashedNonce: string }> {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce))
  const hashedNonce = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return { nonce, hashedNonce }
}
