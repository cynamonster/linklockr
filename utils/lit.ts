import { createLitClient } from "@lit-protocol/lit-client";
import { nagaDev, nagaTest } from "@lit-protocol/networks";

class Lit {
  private litClient: any = null;

  private async getClient() {
    if (typeof window === "undefined") return null;

    // 1. The Sledgehammer: Intercept and reroute all Yellowstone traffic
    if (!(window as any).litFetchPatched) {
      const originalFetch = window.fetch;
      window.fetch = async function (...args) {
        let [resource, config] = args;
        
        // If the SDK tries to hit the dead node, hijack it
        if (typeof resource === 'string' && resource.includes('yellowstone-rpc.litprotocol.com')) {
          console.log("Hijacking Yellowstone request -> Routing to Proxy");
          resource = '/api/lit-rpc'; 
        }
        
        return originalFetch(resource, config);
      };
      (window as any).litFetchPatched = true;
    }

    // 2. Initialize the client normally
    if (!this.litClient) {
      this.litClient = await createLitClient({
        network: nagaTest, 
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