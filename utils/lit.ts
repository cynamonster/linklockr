/**
 * Lit Protocol v3 (Chipotle) Integration
 * Supports both cloud and self-hosted Chipotle instances
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_LIT_API_KEY: API key for authentication
 * - NEXT_PUBLIC_LIT_API_ENDPOINT: Custom Chipotle endpoint (defaults to dev.litprotocol.com)
 * 
 * Self-Hosted Chipotle Setup:
 * Set NEXT_PUBLIC_LIT_API_ENDPOINT=http://localhost:3000 to use local instance
 * 
 * API Reference: https://api.dev.litprotocol.com/docs
 * Dashboard: https://dashboard.dev.litprotocol.com
 */

// Determine which Chipotle endpoint to use
const getLitApiBase = (): string => {
  const customEndpoint = process.env.NEXT_PUBLIC_LIT_API_ENDPOINT;
  
  // Use custom endpoint if provided (for self-hosted or alternative deployments)
  if (customEndpoint) {
    console.log(`[Lit] Using custom Chipotle endpoint: ${customEndpoint}`);
    return customEndpoint;
  }
  
  // Default to Lit's dev environment
  console.log('[Lit] Using Lit dev environment: https://api.dev.litprotocol.com');
  return "https://api.dev.litprotocol.com";
};

const LIT_API_BASE = getLitApiBase();
const LIT_API_KEY = process.env.NEXT_PUBLIC_LIT_API_KEY;

/**
 * Chipotle uses HTTP API for encryption/decryption
 * No SDK needed - just fetch() calls
 * 
 * Supports:
 * - Cloud: api.dev.litprotocol.com
 * - Self-hosted: localhost or custom endpoint
 */
class Lit {
  private apiBase: string = LIT_API_BASE;
  private apiKey: string | undefined = LIT_API_KEY;

  constructor() {
    if (!this.apiKey) {
      console.warn('[Lit] Warning: NEXT_PUBLIC_LIT_API_KEY not set');
    }
    console.log(`[Lit] Initialized with endpoint: ${this.apiBase}`);
  }

  /**
   * Encrypt a URL with Chipotle using unified access control conditions
   * @param url The URL/content to encrypt
   * @param tokenId The ERC-1155 token ID (used in access conditions)
   */
  async encryptLink(url: string, tokenId: string) {
    if (!this.apiKey) {
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
      console.log(`[Lit] Encrypting with Chipotle (${this.apiBase})`);
      
      const response = await fetch(`${this.apiBase}/api/v3/encrypt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          data: url,
          accessControlConditions,
          chain: "base",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Chipotle encryption failed: ${error.message || error.error}`);
      }

      const result = await response.json();
      console.log('[Lit] Encryption successful');

      return {
        ciphertext: result.ciphertext,
        dataToEncryptHash: result.dataToEncryptHash,
        accessControlConditions,
      };
    } catch (error) {
      console.error("[Lit] Encryption error:", error);
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
    if (!this.apiKey) {
      throw new Error("NEXT_PUBLIC_LIT_API_KEY environment variable not set");
    }

    try {
      console.log(`[Lit] Decrypting with Chipotle (${this.apiBase})`);
      
      const response = await fetch(`${this.apiBase}/api/v3/decrypt`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
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
      console.log('[Lit] Decryption successful');
      
      return result.decryptedData;
    } catch (error) {
      console.error("[Lit] Decryption error:", error);
      throw error;
    }
  }

  /**
   * Get the latest blockhash for nonce generation in SIWE
   * Chipotle gets this via a simple HTTP call
   * 
   * For self-hosted: May use blockchain directly if configured
   */
  async getLatestBlockhash(): Promise<string> {
    try {
      console.log('[Lit] Fetching latest blockhash');
      
      const response = await fetch(`${this.apiBase}/api/v3/blockhash`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch blockhash");
      }

      const result = await response.json();
      return result.blockhash;
    } catch (error) {
      console.error("[Lit] Blockhash fetch error:", error);
      // Fallback: use current timestamp as nonce if API fails
      const fallback = Date.now().toString();
      console.log(`[Lit] Using fallback blockhash: ${fallback}`);
      return fallback;
    }
  }

  /**
   * Health check for Chipotle endpoint
   * Useful for debugging connection issues
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBase}/health`, {
        method: "GET",
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const lit = new Lit();