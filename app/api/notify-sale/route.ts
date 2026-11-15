import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { slug, buyer, priceUsd, txHash } = await req.json();

    const webhookUrl = process.env.DISCORD_SALES_WEBHOOK_URL;
    if (!webhookUrl) {
      // Webhook not configured yet, succeed quietly
      return NextResponse.json({ success: true, message: "Webhook not configured" });
    }

    const shortBuyer = buyer ? `${buyer.slice(0, 6)}...${buyer.slice(-4)}` : "Anonymous";
    const formattedPrice = priceUsd ? Number(priceUsd).toFixed(2) : "0.00";
    const basescanTxUrl = txHash ? `https://basescan.org/tx/${txHash}` : `https://basescan.org/address/${process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0x62B223CD9c80fe3D468513CA14bd3Ad6149B248e'}`;
    const buyerBasescanUrl = buyer ? `https://basescan.org/address/${buyer}` : "";

    const discordPayload = {
      username: "LinkLockr Sales Feed",
      embeds: [
        {
          title: "🎉 New Link Unlocked!",
          url: `https://linklockr.xyz/buy/${slug}`,
          color: 0x00f2fe, // Neon Cyan
          description: `A buyer just paid with **USDC on Base** to unlock **[${slug}](https://linklockr.xyz/buy/${slug})**!`,
          fields: [
            {
              name: "💰 Price",
              value: `$${formattedPrice} USDC`,
              inline: true,
            },
            {
              name: "👤 Buyer",
              value: buyer ? `[${shortBuyer}](${buyerBasescanUrl})` : "Anonymous",
              inline: true,
            },
            {
              name: "⛓️ Network",
              value: "Base (Sub-cent gas)",
              inline: true,
            },
            {
              name: "📜 Transaction",
              value: txHash ? `[View on Basescan](${basescanTxUrl})` : "Verified On-Chain",
              inline: false,
            },
          ],
          footer: {
            text: "LinkLockr Protocol • Decentralized Encryption via Lit Protocol",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });

    if (!res.ok) {
      console.warn("Discord webhook returned status:", res.status);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error sending sales notification to Discord:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
