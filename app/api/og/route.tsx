import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || 'Secure Content';
  const price = searchParams.get('price') || '5.00';
  const formattedTitle = slug.replace(/-/g, ' ');

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
          backgroundColor: '#0B0C15',
          backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(34, 211, 238, 0.15) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(99, 102, 241, 0.15) 0%, transparent 50%)',
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
                fontSize: '24px',
              }}
            >
              🔒
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
    }
  );
}
