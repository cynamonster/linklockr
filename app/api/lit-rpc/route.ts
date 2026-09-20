import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const response = await fetch("https://yellowstone-rpc.litprotocol.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        // Bypasses Cloudflare blocking Node.js default fetches
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Origin": "https://yellowstone-rpc.litprotocol.com",
        "Referer": "https://yellowstone-rpc.litprotocol.com/"
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    return NextResponse.json({ 
      error: "Failed to proxy Lit RPC request", 
      details: error.message 
    }, { status: 500 });
  }
}