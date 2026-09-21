import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const targetRpcUrl = "https://litsentry.litprotocol.com/";

  try {
    const body = await req.json();
    
    const response = await fetch(targetRpcUrl, {
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