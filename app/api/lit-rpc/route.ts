import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const response = await fetch("https://yellowstone-rpc.litprotocol.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    // 1. Read the raw text first to prevent JSON parse crashes
    const rawText = await response.text();
    
    let data;
    try {
      // 2. Attempt to parse it as JSON
      data = JSON.parse(rawText);
    } catch (parseError) {
      // 3. If it fails, log the HTML/text the RPC actually sent back
      console.error("Lit RPC returned non-JSON response. Status:", response.status, "Body:", rawText);
      return new NextResponse(rawText, { status: response.status || 502 });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Lit RPC Proxy Error (Network level):", error.message);
    return NextResponse.json({ 
      error: "Failed to proxy Lit RPC request", 
      details: error.message 
    }, { status: 500 });
  }
}