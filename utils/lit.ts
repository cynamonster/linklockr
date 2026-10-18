import { generateNonce, SiweMessage } from "siwe";

/**
 * Creates a standard EIP-4361 Sign-In with Ethereum (SIWE) message
 * for authenticating decryption requests with the Lit Protocol v3 TEE.
 */
export function createSiweMessage({
  address,
  statement = "Sign this message to prove you own the wallet to access this content.",
  domain = typeof window !== "undefined" ? window.location.host : "localhost",
  uri = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  chainId = 8453,
}: {
  address: string;
  statement?: string;
  domain?: string;
  uri?: string;
  chainId?: number;
}): string {
  const nonce = generateNonce();
  const siwe = new SiweMessage({
    domain,
    address,
    statement,
    uri,
    version: "1",
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
    expirationTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  });
  return siwe.prepareMessage();
}