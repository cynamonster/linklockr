import { supabase } from "@/utils/supabase";
import BuyClientWrapper from "./BuyClientWrapper";
import type { Metadata } from "next";
import { setRequestLocale } from 'next-intl/server';

// Cache rendered link pages on Vercel's global edge network for 60s
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const formattedTitle = slug ? slug.replace(/-/g, " ") : "Content";

  let priceFormatted = "5.00";
  let isSensitive = false;

  try {
    const { data } = await supabase
      .from("links")
      .select("price_usd, is_sensitive, status")
      .eq("slug", slug)
      .maybeSingle();

    if (data?.price_usd) {
      priceFormatted = Number(data.price_usd).toFixed(2);
    }
    if (data?.is_sensitive || data?.status === "flagged") {
      isSensitive = true;
    }
  } catch {}

  const title = isSensitive
    ? `Secure Content ($${priceFormatted} USDC) | LinkLockr`
    : `Unlock ${formattedTitle} ($${priceFormatted} USDC) | LinkLockr`;
  const description = isSensitive
    ? `Discreet digital access on Base L2. Unlock with Base Native USDC. Zero chargebacks.`
    : `Instant paywall on Base L2. Unlock with Base Native USDC. Sub-cent gas, zero chargebacks, encrypted via Lit Protocol TEEs.`;
  const pageUrl = `https://linklockr.xyz/buy/${slug}`;
  const ogImageUrl = `https://linklockr.xyz/api/og?slug=${encodeURIComponent(slug)}&price=${encodeURIComponent(priceFormatted)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "LinkLockr",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `Unlock ${formattedTitle} on LinkLockr`,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
      creator: "@LinkLockr",
    },
    other: {
      // Farcaster Frame vNext / v2 metadata
      "fc:frame": "vNext",
      "fc:frame:image": ogImageUrl,
      "fc:frame:image:aspect_ratio": "1.91:1",
      "fc:frame:button:1": `Unlock ($${priceFormatted} USDC)`,
      "fc:frame:button:1:action": "link",
      "fc:frame:button:1:target": pageUrl,
    },
  };
}

export default async function BuyPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  let initialLinkData = null;
  let initialError: string | null = null;

  try {
    const { data, error } = await supabase
      .from("links")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      initialError = error.message;
    } else if (!data) {
      initialError = "Link not found or has been removed.";
    } else if (!data.active) {
      initialError = "This link has been suspended due to reports.";
    } else {
      initialLinkData = data;
    }
  } catch (err: any) {
    initialError = err.message || "Failed to load link";
  }

  return (
    <BuyClientWrapper
      slug={slug}
      initialLinkData={initialLinkData}
      initialError={initialError}
    />
  );
}
