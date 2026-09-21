import crypto from "crypto";
import { ethers } from "ethers";

const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.ENCRYPTION_MASTER_KEY || "", "hex");

export function encryptUrl(plaintext: string): { ciphertext: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let ciphertext = cipher.update(plaintext, "utf8", "hex");
  ciphertext += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");

  return { ciphertext, iv: iv.toString("hex"), tag };
}

export function decryptUrl(ciphertext: string, iv: string, tag: string): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(iv, "hex"));
  decipher.setAuthTag(Buffer.from(tag, "hex"));

  let plaintext = decipher.update(ciphertext, "hex", "utf8");
  plaintext += decipher.final("utf8");
  return plaintext;
}

export async function checkTokenOwnership(userAddress: string, tokenId: string): Promise<boolean> {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || "https://mainnet.base.org");
  const abi = ["function balanceOf(address account, uint256 id) view returns (uint256)"];
  const contract = new ethers.Contract(process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!, abi, provider);

  const balance: bigint = await contract.balanceOf(userAddress, BigInt(tokenId));
  return balance > BigInt(0);
}