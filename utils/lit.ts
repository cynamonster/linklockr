import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { encryptString, decryptToString } from "@lit-protocol/encryption";


const CLIENT = new LitNodeClient({
  litNetwork: "datil-dev",
  debug: false
});


class Lit {
  private litNodeClient: LitNodeClient;

  constructor() {
    this.litNodeClient = CLIENT;
  }

  async connect() {
    if (!this.litNodeClient.ready) {
      await this.litNodeClient.connect();
    }
  }

  /**
   * Helper: Get the latest blockhash.
   * Required for generating a valid SIWE message manually in the frontend.
   */
  async getLatestBlockhash() {
    await this.connect();
    return await this.litNodeClient.getLatestBlockhash();
  }

  /**
   * 1. Encrypts the URL.
   * Expects the ALREADY calculated tokenId (uint256 string).
   */
  async encryptLink(url: string, tokenId: string, chain: string = "base") {
    await this.connect();

    const accessControlConditions = [
      {
        contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
        standardContractType: "ERC1155",
        chain: "base",
        method: "balanceOf",
        parameters: [
            ":userAddress", 
            tokenId // Expecting the string of the uint256 ID
        ],
        returnValueTest: {
          comparator: ">",
          value: "0",
        },
      },
    ];

    // Encrypt the URL
    const { ciphertext, dataToEncryptHash } = await encryptString(
      {
        accessControlConditions,
        dataToEncrypt: url
        // authSig,
        // chain: "base"
      },
      this.litNodeClient
    );

    return {
      ciphertext,
      dataToEncryptHash,
      accessControlConditions,
    };
  }

  /**
   * 2. Decrypts the URL.
   * Accepts 'authSig' which we manually generated in the frontend.
   */
  async decryptLink(ciphertext: string, dataToEncryptHash: string, accessControlConditions: any[], authSig: any) {
    await this.connect();

    const decryptedString = await decryptToString(
      {
        accessControlConditions,
        ciphertext,
        dataToEncryptHash,
        authSig, // <--- Key fix: Passing the authSig explicitly
        chain: "base",
      },
      this.litNodeClient
    );

    return decryptedString;
  }
}

export const lit = new Lit();