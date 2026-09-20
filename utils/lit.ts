import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { encryptString, decryptToString } from "@lit-protocol/encryption";

class Lit {
  private litNodeClient: LitNodeClient | null = null;

  /**
   * Lazily initializes and connects the client only when needed in the browser.
   */
  private getClient(): LitNodeClient {
    if (!this.litNodeClient) {
      this.litNodeClient = new LitNodeClient({
        litNetwork: "datil-test", // Switch to "datil" for production
        debug: false,
      });
    }
    return this.litNodeClient;
  }

  async connect() {
    if (typeof window === "undefined") return; // Prevent SSR crashes

    const client = this.getClient();
    if (!client.ready) {
      try {
        await client.connect();
      } catch (error) {
        console.error("Failed to connect to Lit Network:", error);
        throw error;
      }
    }
  }

  /**
   * Helper: Get the latest blockhash.
   */
  async getLatestBlockhash() {
    await this.connect();
    const client = this.getClient();
    return await client.getLatestBlockhash();
  }

  /**
   * 1. Encrypts the URL.
   */
  async encryptLink(url: string, tokenId: string, chain: string = "base") {
    await this.connect();
    const client = this.getClient();

    const accessControlConditions = [
      {
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        standardContractType: "ERC1155",
        chain: "base",
        method: "balanceOf",
        parameters: [
          ":userAddress", 
          tokenId
        ],
        returnValueTest: {
          comparator: ">",
          value: "0",
        },
      },
    ];

    const { ciphertext, dataToEncryptHash } = await encryptString(
      {
        accessControlConditions,
        dataToEncrypt: url,
      },
      client
    );

    return {
      ciphertext,
      dataToEncryptHash,
      accessControlConditions,
    };
  }

  /**
   * 2. Decrypts the URL.
   */
  async decryptLink(ciphertext: string, dataToEncryptHash: string, accessControlConditions: any[], authSig: any) {
    await this.connect();
    const client = this.getClient();

    const decryptedString = await decryptToString(
      {
        accessControlConditions,
        ciphertext,
        dataToEncryptHash,
        authSig,
        chain: "base",
      },
      client
    );

    return decryptedString;
  }
}

export const lit = new Lit();