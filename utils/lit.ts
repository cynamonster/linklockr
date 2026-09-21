/**
 * Lit Protocol v3 (Chipotle) Integration
 * Uses REST API instead of SDK for encryption/decryption
 * 
 * API Reference: https://api.dev.litprotocol.com/docs
 * Dashboard: https://dashboard.dev.litprotocol.com
 */

const LIT_API_BASE = "https://api.dev.litprotocol.com";
const LIT_API_KEY = process.env.NEXT_PUBLIC_LIT_API_KEY;

/**
 * Chipotle uses HTTP API for encryption/decryption
 * No SDK needed - just fetch() calls
 */
class Lit {
  /**
   * Encrypt a URL with Chipotle using unified access control conditions
   * @param url The URL/content to encrypt
   * @param tokenId The ERC-1155 token ID (used in access conditions)
   */
  async encryptLink(url: string, tokenId: string) {
    if (!LIT_API_KEY) {
      throw new Error("NEXT_PUBLIC_LIT_API_KEY environment variable not set");
    }

    const accessControlConditions = [
      {
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        standardContractType: "ERC1155",
        chain: "base",
        method: "balanceOf",
        parameters: [":userAddress", tokenId],
        returnValueTest: {
          comparator: ">",
          value: "0",
        },
      },
    ];

    try {
      const response = await fetch(`${LIT_API_BASE}/api/v3/encrypt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LIT_API_KEY}`,
        },
        body: JSON.stringify({
          data: url,
          accessControlConditions,
          chain: "base",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Chipotle encryption failed: ${error.message}`);
      }

      const result = await response.json();

      return {
        ciphertext: result.ciphertext,
        dataToEncryptHash: result.dataToEncryptHash,
        accessControlConditions,
      };
    } catch (error) {
      console.error("Encryption error:", error);
      throw error;
    }
  }

  /**
   * Decrypt a URL with Chipotle
   * @param ciphertext Encrypted content
   * @param dataToEncryptHash Hash of original data
   * @param accessControlConditions Access control rules
   * @param authSig Authentication signature (from signMessage)
   */
  async decryptLink(
    ciphertext: string,
    dataToEncryptHash: string,
    accessControlConditions: any[],
    authSig: any
  ) {
    if (!LIT_API_KEY) {
      throw new Error("NEXT_PUBLIC_LIT_API_KEY environment variable not set");
    }

    try {
      const response = await fetch(`${LIT_API_BASE}/api/v3/decrypt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LIT_API_KEY}`,
        },
        body: JSON.stringify({
          ciphertext,
          dataToEncryptHash,
          accessControlConditions,
          authSig, // SIWE signature from user
          chain: "base",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(
          `Chipotle decryption failed: ${error.message || error.error}`
        );
      }

      const result = await response.json();
      return result.decryptedData;
    } catch (error) {
      console.error("Decryption error:", error);
      throw error;
    }
  }

  /**
   * Get the latest blockhash for nonce generation in SIWE
   * Chipotle gets this via a simple HTTP call
   */
  async getLatestBlockhash(): Promise<string> {
    try {
      const response = await fetch(`${LIT_API_BASE}/api/v3/blockhash`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LIT_API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch blockhash");
      }

      const result = await response.json();
      return result.blockhash;
    } catch (error) {
      console.error("Blockhash fetch error:", error);
      // Fallback: use current timestamp as nonce if API fails
      return Date.now().toString();
    }
  }
}

export const lit = new Lit();