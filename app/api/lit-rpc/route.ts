import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // Use the official active Lit Chronicle Testnet RPC
  const targetRpcUrl = "https://chain-rpc.litprotocol.com/http";

  try {
    const body = await req.json();
    
    // Add a 9-second timeout to prevent Vercel 504 hard-crashes
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const response = await fetch(targetRpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const rawText = await response.text();
    
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      return new NextResponse(rawText, { status: 502 });
    }

    return NextResponse.json(data, { status: response.status });

  } catch (error: any) {
    if (error.name === 'AbortError') {
      return NextResponse.json({ 
        error: "Lit Network is heavily congested. Please try again.",
        target: targetRpcUrl 
      }, { status: 504 });
    }
    
    return NextResponse.json({ 
      error: "Failed to proxy Lit RPC request", 
      details: error.message,
      target: targetRpcUrl
    }, { status: 500 });
  }
}