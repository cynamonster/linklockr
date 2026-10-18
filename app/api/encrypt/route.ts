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
        const ciphertext = await Lit.Actions.Encrypt({
          pkpId: pkpId,
          message: url
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
      body: JSON.stringify({
        code,
        js_params: {
          pkpId,
          url,
        },
      }),
    });

    if (!res.ok) {
      let errorMsg = "Lit encryption failed";
      try {
        const err = await res.json();
        errorMsg = typeof err === "string" ? err : err.message || err.error || JSON.stringify(err);
      } catch {
        errorMsg = await res.text().catch(() => "Lit encryption failed");
      }
      return NextResponse.json({ error: errorMsg }, { status: res.status });
    }

    const data = await res.json();
    const ciphertext = data.response?.ciphertext;

    if (!ciphertext) {
      return NextResponse.json({ error: "No ciphertext returned from Lit action" }, { status: 500 });
    }

    return NextResponse.json({ ciphertext });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to encrypt" }, { status: 500 });
  }
}