import { NextResponse } from "next/server";
import { nagaTest } from "@lit-protocol/networks";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Use the active Naga testnet RPC, not the dead Yellowstone one
    const response = await fetch("https://litsentry.litprotocol.com/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
    });

    const rawText = await response.text();
    
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error("Lit RPC returned non-JSON response:", rawText);
      return new NextResponse(rawText, { status: response.status || 502 });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to proxy Lit RPC request" }, { status: 500 });
  }
}