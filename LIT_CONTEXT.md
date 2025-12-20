# LIT_CONTEXT.md - Encryption Logic

## 1. Configuration
* **Network:** `datil-dev` (Testnet) or `datil` (Mainnet).
* **SDK Version:** Lit JS SDK v6.
* **Chain:** `base`.

## 2. Access Control Conditions (ACC)
We use "Token Ownership" to unlock content. The user must own the ERC-1155 token corresponding to the slug hash.

```javascript
const accessControlConditions = [
  {
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    standardContractType: 'ERC1155',
    chain: 'base',
    method: 'balanceOf',
    parameters: [
      ':userAddress',
      'TOKEN_ID_GOES_HERE' // This is the keccak256 hash of the slug
    ],
    returnValueTest: {
      comparator: '>',
      value: '0' // User must own at least 1
    }
  }
]