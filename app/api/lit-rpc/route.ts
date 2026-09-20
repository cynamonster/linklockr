import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Forward the request to the Lit Protocol Yellowstone RPC
    const response = await fetch("https://yellowstone-rpc.litprotocol.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Lit RPC Proxy Error:", error);
    return NextResponse.json({ error: "Failed to proxy Lit RPC request" }, { status: 500 });
  }
}