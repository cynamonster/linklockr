# Lit Protocol v3 Chipotle Migration Guide

This project has been migrated from Lit SDK (v8) to **Lit Protocol v3 Chipotle**, which uses a simple REST API instead of the JavaScript SDK.

## What Changed

### ✅ Removed
- `@lit-protocol/lit-client` - SDK no longer needed
- `@lit-protocol/auth-browser` - Using standard SIWE signing instead
- `@lit-protocol/constants` - Not required for REST API
- `@lit-protocol/networks` - No network configuration needed
- SDK client initialization and coordination logic

### ✅ Added
- Simple HTTP/REST API calls via `fetch()`
- API key-based authentication
- Direct REST endpoints at `api.dev.litprotocol.com`

## Setup Required

### 1. Get an API Key
1. Visit the Chipotle Dashboard: https://dashboard.dev.litprotocol.com
2. Create an account or sign in
3. Generate an API key in the dashboard
4. Add it to your `.env.local`:

```bash
NEXT_PUBLIC_LIT_API_KEY=your_api_key_here
```

### 2. Create a Wallet (PKP) in Chipotle
For decryption, you may need to set up a Lit Action or use the dashboard to manage wallets:
- Go to https://dashboard.dev.litprotocol.com
- Create or import a wallet (PKP)
- Configure permissions for your Lit Actions

### 3. API Reference
- **Docs**: https://docs.dev.litprotocol.com
- **API Base**: `https://api.dev.litprotocol.com`
- **Dashboard**: https://dashboard.dev.litprotocol.com

## How It Works Now

### Before (SDK)
```javascript
import { createLitClient } from "@lit-protocol/lit-client";
const client = await createLitClient({ network: nagaDev });
const encrypted = await client.encrypt({ ... });
```

### After (REST API - Chipotle)
```javascript
// utils/lit.ts now handles HTTP calls directly
const encrypted = await lit.encryptLink(url, tokenId);
const decrypted = await lit.decryptLink(ciphertext, hash, conditions, authSig);
```

## Authentication Flow
1. User signs a SIWE message with their wallet (no change)
2. Signature is sent to Chipotle REST API with API key
3. API validates and performs encryption/decryption

## API Endpoints Used

- **POST /api/v3/encrypt** - Encrypt data
- **POST /api/v3/decrypt** - Decrypt data  
- **GET /api/v3/blockhash** - Get nonce for SIWE

## Migration Checklist

- [ ] Add `NEXT_PUBLIC_LIT_API_KEY` to `.env.local`
- [ ] Test encryption on the create link page
- [ ] Test decryption on the buy link page
- [ ] Verify access control conditions work (ERC-1155 balance check)
- [ ] Monitor Chipotle API responses in browser console

## Troubleshooting

### "NEXT_PUBLIC_LIT_API_KEY environment variable not set"
- Add the variable to `.env.local` (see Setup Required above)

### Encryption failures
- Check API key is valid
- Verify `NEXT_PUBLIC_CONTRACT_ADDRESS` is set
- Check browser console for detailed error messages

### Decryption failures
- Ensure user owns the ERC-1155 token (check balance)
- Verify SIWE message signature is valid
- Check access control conditions match the encrypted data

## Key Differences

| Aspect | Naga (Old) | Chipotle (New) |
|--------|----------|---------|
| **Client** | SDK (@lit-protocol/lit-client) | REST API (fetch) |
| **Auth** | Wallet-based | API keys + SIWE signatures |
| **Execution** | Multi-node threshold crypto | Single TEE |
| **Speed** | Slower (multi-node coordination) | Faster (single machine) |
| **Cost** | Higher infrastructure | Significantly lower |
| **Integration** | Complex SDK setup | Simple HTTP calls |

## Next Steps

1. Get your API key from the dashboard
2. Add it to `.env.local`
3. Test the encryption/decryption flow
4. Deploy when ready for production

**Note**: Chipotle is currently in dev. Production launch details will be announced on the Lit Protocol website.

## Resources
- Blog announcement: https://spark.litprotocol.com/introducing-lit-protocol-v3-chipotle/
- Documentation: https://docs.dev.litprotocol.com
- Discord support: https://getlit.dev/chat
