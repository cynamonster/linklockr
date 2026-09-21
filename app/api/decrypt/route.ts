import { NextResponse } from "next/server";
import { SiweMessage } from "siwe";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase server credentials (URL or SERVICE_ROLE_KEY)");
  }

  return createClient(url, key);
}

export async function POST(req: Request) {
  try {
    const { slug, message, signature } = await req.json();

    // 1. Verify SIWE signature to validate wallet address
    const siweMessage = new SiweMessage(message);
    const { data: fields } = await siweMessage.verify({ signature });
    const userAddress = fields.address;

    // 2. Fetch record from Supabase inside the handler
    const supabase = getSupabase();
    const { data: linkRecord, error: dbError } = await supabase
      .from("links")
      .select("ciphertext, token_id")
      .eq("slug", slug)
      .maybeSingle();

    if (dbError || !linkRecord) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    const apiKey = process.env.LIT_API_KEY;
    const pkpId = process.env.LIT_PKP_ID;
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

    if (!apiKey || !pkpId || !contractAddress) {
      return NextResponse.json({ error: "Server missing Lit or contract configuration" }, { status: 500 });
    }

    // 3. Lit Action: Verify on Base & Decrypt inside TEE
    const code = `
      async function main() {
        const provider = new ethers.providers.JsonRpcProvider("https://mainnet.base.org");
        const abi = ["function balanceOf(address account, uint256 id) view returns (uint256)"];
        const contract = new ethers.Contract("${contractAddress}", abi, provider);

        const balance = await contract.balanceOf("${userAddress}", "${linkRecord.token_id}");
        if (balance.lte(0)) {
          return { error: "Access denied: missing required ERC-1155 token." };
        }

        const plaintext = await Lit.Actions.decrypt({
          pkpId: "${pkpId}",
          ciphertext: "${linkRecord.ciphertext}"
        });

        return { url: plaintext };
      }
    `;

    const res = await fetch("https://api.chipotle.litprotocol.com/core/v1/lit_action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({ code }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.message || "Lit Action failed" }, { status: res.status });
    }

    const { response } = await res.json();

    if (response.error) {
      return NextResponse.json({ error: response.error }, { status: 403 });
    }

    return NextResponse.json({ url: response.url });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to decrypt" }, { status: 500 });
  }
}