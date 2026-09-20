import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev, nagaTest } from "@lit-protocol/networks";

class Lit {
  private litClient: any = null;

  private async getClient() {
    if (typeof window === "undefined") return null;

    if (!this.litClient) {
      this.litClient = await createLitClient({
        network: nagaTest.withOverrides({ rpcUrl: "/api/lit-rpc" }), // Try nagaTest if nagaDev endpoints are flaky
        
      });
    }
    return this.litClient;
  }

  async getLatestBlockhash(): Promise<string> {
    const client = await this.getClient();
    if (!client) throw new Error("Client unavailable on server");
    
    // Get the latest blockhash from the Lit network for nonce generation
    const latestBlockhash = await client.getLatestBlockhash();
    return latestBlockhash;
  }

  async encryptLink(url: string, tokenId: string) {
    const client = await this.getClient();
    if (!client) throw new Error("Client unavailable on server");

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

    const { ciphertext, dataToEncryptHash } = await client.encrypt({
      dataToEncrypt: url,
      unifiedAccessControlConditions: accessControlConditions,
    });

    return {
      ciphertext,
      dataToEncryptHash,
      accessControlConditions,
    };
  }

  async decryptLink(ciphertext: string, dataToEncryptHash: string, accessControlConditions: any[], sessionSigs: any) {
    const client = await this.getClient();
    if (!client) throw new Error("Client unavailable on server");

    const decryptedString = await client.decrypt({
      data: {
        ciphertext,
        dataToEncryptHash,
      },
      unifiedAccessControlConditions: accessControlConditions,
      authContext: sessionSigs,
    });

    return decryptedString;
  }
}

export const lit = new Lit();