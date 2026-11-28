import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { FolderLock } from 'lucide-react';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  const price = searchParams.get('price') || '5.00';

  const isLinkDrop = !!slug && slug !== 'home' && slug !== 'default' && slug !== 'Secure Content';
  const formattedTitle = slug ? slug.replace(/-/g, ' ') : 'Secure Content';

  if (!isLinkDrop) {
    // ----------------------------------------------------
    // 1. BRAND / HOMEPAGE HERO SOCIAL CARD (1200 x 630)
    // ----------------------------------------------------
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#07080E',
            backgroundImage:
              'radial-gradient(circle at 15% 20%, rgba(34, 211, 238, 0.18) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(139, 92, 246, 0.18) 0%, transparent 45%)',
            padding: '50px 70px',
            fontFamily: 'sans-serif',
            color: 'white',
          }}
        >
          {/* TOP NAV BAR */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(34, 211, 238, 0.15)',
                  border: '1px solid rgba(34, 211, 238, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FolderLock size={30} color="#22d3ee" strokeWidth={2} />
              </div>
              <span
                style={{
                  fontSize: '36px',
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  color: '#ffffff',
                }}
              >
                LinkLockr
              </span>
            </div>

            {/* Network pill */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(34, 211, 238, 0.1)',
                border: '1px solid rgba(34, 211, 238, 0.35)',
                color: '#22d3ee',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              <span>Base Network • Native USDC</span>
            </div>
          </div>

          {/* MAIN HERO CONTENT */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '16px',
              maxWidth: '1000px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 16px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(34, 211, 238, 0.08)',
                border: '1px solid rgba(34, 211, 238, 0.25)',
                color: '#22d3ee',
                fontSize: '15px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
              }}
            >
              Web3 Content Commerce
            </div>

            <div
              style={{
                fontSize: '66px',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.08,
                color: '#ffffff',
              }}
            >
              Create Paywalled Links
            </div>

            <div
              style={{
                fontSize: '24px',
                color: '#94a3b8',
                lineHeight: 1.4,
                maxWidth: '920px',
              }}
            >
              Sell access to content with instant settlement in USDC on Base. Zero chargebacks. Gas fees less than one penny.
            </div>

            {/* 4 HIGHLIGHT PILLS */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginTop: '10px',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '16px',
                  color: '#e2e8f0',
                  fontWeight: 600,
                }}
              >
                ⚡ Instant USDC Settlement
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '16px',
                  color: '#e2e8f0',
                  fontWeight: 600,
                }}
              >
                🛡️ Zero Chargebacks
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '16px',
                  color: '#e2e8f0',
                  fontWeight: 600,
                }}
              >
                🔐 Lit Protocol TEE Encryption
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontSize: '16px',
                  color: '#e2e8f0',
                  fontWeight: 600,
                }}
              >
                ⛽ &lt; $0.01 Gas
              </div>
            </div>
          </div>

          {/* FOOTER BAR */}
          <div
            style={{
              display: 'flex',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '20px',
              fontSize: '17px',
              color: '#64748b',
            }}
          >
            <span style={{ color: '#22d3ee', fontWeight: 700 }}>linklockr.xyz</span>
            <span>Decentralized Encryption on Lit Protocol • Built on Base L2</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      }
    );
  }

  // ----------------------------------------------------
  // 2. DYNAMIC LINK UNLOCK SOCIAL CARD (1200 x 630)
  // ----------------------------------------------------
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#07080E',
          backgroundImage:
            'radial-gradient(circle at 25% 25%, rgba(34, 211, 238, 0.16) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.16) 0%, transparent 50%)',
          padding: '60px 80px',
          fontFamily: 'sans-serif',
          color: 'white',
        }}
      >
        {/* TOP BRAND HEADER */}
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                backgroundColor: 'rgba(34, 211, 238, 0.15)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderLock size={26} color="#22d3ee" strokeWidth={2} />
            </div>
            <span style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '-0.02em' }}>LinkLockr</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(34, 211, 238, 0.1)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              color: '#22d3ee',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            <span>Base L2 • Instant USDC</span>
          </div>
        </div>

        {/* CENTER CONTENT TITLE & PRICE */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '20px' }}>
          <div
            style={{
              fontSize: '20px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              color: '#94a3b8',
              fontWeight: 600,
            }}
          >
            Paywalled Content
          </div>

          <div
            style={{
              fontSize: '56px',
              fontWeight: 900,
              textTransform: 'capitalize',
              color: '#ffffff',
              maxWidth: '900px',
              lineHeight: 1.15,
            }}
          >
            {formattedTitle}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '44px',
              fontWeight: 900,
              color: '#22d3ee',
            }}
          >
            <span>${Number(price).toFixed(2)}</span>
            <span style={{ fontSize: '24px', color: '#cbd5e1', fontWeight: 600 }}>USDC</span>
          </div>
        </div>

        {/* BOTTOM TRUST BADGES */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '24px',
            fontSize: '18px',
            color: '#64748b',
          }}
        >
          <span>Lit Protocol TEE Encryption</span>
          <span>Zero Chargebacks • No Sign-up Required</span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    }
  );
}
