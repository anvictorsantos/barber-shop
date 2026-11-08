export function e2ePassword(): string {
  const password = process.env.E2E_PASSWORD
  if (!password) throw new Error('Set E2E_PASSWORD to run authenticated E2E specs.')
  return password
}
