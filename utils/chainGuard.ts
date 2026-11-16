export const BASE_CHAIN_ID = 8453;
export const BASE_CHAIN_ID_HEX = '0x2105';

export const BASE_CHAIN_CONFIG = {
  chainId: BASE_CHAIN_ID_HEX,
  chainName: 'Base',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

/**
 * Ensures the connected wallet is on Base Mainnet (Chain ID 8453).
 * Prompts network switch if on another chain, and throws a clear user-facing error if rejected or failed.
 */
export async function ensureBaseChain(wallet: any): Promise<void> {
  if (!wallet) return;

  // 1. Try Privy's built-in switchChain
  if (typeof wallet.switchChain === 'function') {
    try {
      await wallet.switchChain(BASE_CHAIN_ID);
    } catch (switchErr: any) {
      console.warn('Privy switchChain notice:', switchErr);
    }
  }

  // 2. Direct EIP-1193 provider verification & switch fallback
  if (typeof wallet.getEthereumProvider === 'function') {
    const provider = await wallet.getEthereumProvider();
    if (provider && typeof provider.request === 'function') {
      try {
        const currentChainHex = await provider.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(currentChainHex, 16);

        if (currentChainId !== BASE_CHAIN_ID) {
          try {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: BASE_CHAIN_ID_HEX }],
            });
          } catch (rpcErr: any) {
            // Error 4902: Chain has not been added to the wallet yet
            if (rpcErr.code === 4902 || rpcErr?.data?.originalError?.code === 4902) {
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [BASE_CHAIN_CONFIG],
              });
            } else {
              throw rpcErr;
            }
          }

          // Re-verify after switch attempt
          const postSwitchChainHex = await provider.request({ method: 'eth_chainId' });
          if (parseInt(postSwitchChainHex, 16) !== BASE_CHAIN_ID) {
            throw new Error('Please switch your wallet network to Base Mainnet (Chain ID 8453) to proceed.');
          }
        }
      } catch (err: any) {
        if (err.code === 4001 || err.message?.toLowerCase().includes('user rejected')) {
          throw new Error('Network switch to Base Mainnet was rejected. Please switch to Base to proceed.');
        }
        throw new Error(err.message || 'Please switch your wallet network to Base Mainnet (Chain ID 8453) to proceed.');
      }
    }
  }
}
