import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const apiKey = process.env.LIT_API_KEY;
    const pkpId = process.env.LIT_PKP_ID;

    if (!apiKey || !pkpId) {
      return NextResponse.json({ error: "Missing Lit v3 credentials" }, { status: 500 });
    }

    // Lit Action executed securely inside the Chipotle TEE Enclave
    const code = `
      async function main() {
        const ciphertext = await Lit.Actions.encrypt({
          pkpId: "${pkpId}",
          message: "${url.replace(/"/g, '\\"')}"
        });
        return { ciphertext };
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
      return NextResponse.json({ error: err.message || "Lit encryption failed" }, { status: res.status });
    }

    const { response } = await res.json();

    return NextResponse.json({ ciphertext: response.ciphertext });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to encrypt" }, { status: 500 });
  }
}