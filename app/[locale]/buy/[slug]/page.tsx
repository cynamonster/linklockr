import { supabase } from "@/utils/supabase";
import BuyClientWrapper from "./BuyClientWrapper";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const formattedTitle = slug ? slug.replace(/-/g, " ") : "Content";

  return {
    title: `${formattedTitle} | LinkLockr`,
    description: `Purchase and unlock secure content on Base L2 with LinkLockr.`,
    openGraph: {
      title: `${formattedTitle} | LinkLockr`,
      description: `Purchase and unlock secure content on Base L2 with LinkLockr.`,
      url: `https://linklockr.xyz/buy/${slug}`,
    },
  };
}

export default async function BuyPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug } = await params;

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
