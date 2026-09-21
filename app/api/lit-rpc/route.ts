import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // The official, LIVE EVM RPC for the Lit Chronicle Rollup
  const targetRpcUrl = "https://chain-rpc.litprotocol.com/http";

  try {
    const body = await req.json();
    
    const response = await fetch(targetRpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        // Cloudflare WAF spoofing
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error("RPC returned non-JSON:", rawText);
      return new NextResponse(rawText, { status: 502 });
    }

    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to proxy Lit RPC request", 
      details: error.message 
    }, { status: 500 });
  }
}