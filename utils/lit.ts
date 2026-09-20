import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev } from "@lit-protocol/networks";

class Lit {
  private litClient: any = null;

  private async getClient() {
    if (typeof window === "undefined") return null;

    if (!this.litClient) {
      this.litClient = await createLitClient({
        network: nagaDev, // Naga test environment
      });
    }
    return this.litClient;
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