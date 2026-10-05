export type ProofPayload = {
  date: string;
  questionId: string;
  guess: { lat: number; lng: number };
  score: number;
  anonymousId: string;
  expiresAt: string;
};

/** Firma HMAC del comprobante. El secreto vive en PROOF_SECRET (servidor). */
export function signProof(_payload: ProofPayload): string {
  return "unsigned";
}

export function verifyProof(_proof: string): boolean {
  return false;
}
