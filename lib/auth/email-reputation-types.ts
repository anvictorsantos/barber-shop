export interface EmailReputationVerdict {
  disposable: boolean
}

export interface EmailReputationChecker {
  check(email: string): Promise<EmailReputationVerdict | null>
}
