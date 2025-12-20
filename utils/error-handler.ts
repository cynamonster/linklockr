import { formatEther } from 'viem';

export async function getReadableErrorAsync(error: any): Promise<string> {
  const message = error?.message || String(error);

  if (message.includes("insufficient funds")) {
    const regex = /have (\d+) want (\d+)/;
    const match = message.match(regex);

    if (match) {
      // 1. Fetch current price dynamically
      let ethPrice = 2955; // Fallback price
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
        const data = await response.json();
        ethPrice = data.ethereum.usd;
      } catch (e) {
        console.warn("Could not fetch real-time price, using fallback.");
      }

      // 2. Parse the Wei values
      const haveWei = BigInt(match[1]);
      const wantWei = BigInt(match[2]);
      const missingWei = wantWei - haveWei;

      const haveEth = parseFloat(formatEther(haveWei));
      const wantEth = parseFloat(formatEther(wantWei));
      const missingEth = parseFloat(formatEther(missingWei));

      // 3. Format the final message
      const wantUsdc = (wantEth * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const missingUsdc = (missingEth * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      return `Insufficient Funds: This transaction costs ~${wantEth.toFixed(6)} ETH ($${wantUsdc} USDC). You are short by ${missingEth.toFixed(6)} ETH ($${missingUsdc} USDC).`;
    }
    return "Insufficient funds for gas + value.";
  }

  return "Transaction failed. Please check your balance.";
}