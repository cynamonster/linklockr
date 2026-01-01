import { NextResponse } from "next/server";
import { ethers } from "ethers";

// CONFIG
const PRIVATE_KEY = process.env.NEXT_PUBLIC_RELAYER_PRIVATE_KEY!;
const RPC_URL = "https://mainnet.base.org"; // Or Alchemy/Infura
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""; 
const PLATFORM_FEE_RECIPIENT = process.env.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT || ""; 
const ABI = [
  "function buyLink(string _slug, address _recipient, address _feeRecipient, uint256 _feeBps) external"
];

async function fetchEthPriceUsd() {
    try {
        const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        if (!res.ok) throw new Error("Bad response");
        const data = await res.json();
        return data.ethereum.usd;
    } catch (err) {
        // Fallback to conservative default eth price
        return 3500;
    }
}        

export async function POST(req: Request) {
  try {
    const { slug, userAddress, price } = await req.json();

    // 1. Setup Wallet & Contract
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

    // 3. CALCULATE PROFITABILITY
    const NEXT_PUBLIC_FEE_BPS = process.env.NEXT_PUBLIC_FEE_BPS
        ? parseInt(process.env.NEXT_PUBLIC_FEE_BPS)
        : 500; // Default to 500 bps (5%);
    const decimalFeeBps = NEXT_PUBLIC_FEE_BPS / 10000;

    // price may be passed as a wei string or an ETH decimal string. Normalize to wei (BigInt)
    let priceWei: bigint;
    if (typeof price === 'string' && price.includes('.')) {
        priceWei = ethers.parseEther(price);
    } else {
        priceWei = BigInt(price);
    }

    const priceEth = Number(ethers.formatEther(priceWei));
    const ETH_PRICE = await fetchEthPriceUsd();
    const platformFeeUsd = priceEth * ETH_PRICE * decimalFeeBps;

    // Estimate the gas needed for this specific buy (include payment in override)
    const gasLimit = await contract.buyLink.estimateGas(
        slug, userAddress, PLATFORM_FEE_RECIPIENT, NEXT_PUBLIC_FEE_BPS,
        { value: priceWei }
    );
    
    // Get current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(100000000); // Default 0.1 gwei
    
    // Calculate total cost in ETH
    const costInWei = gasLimit * gasPrice;
    const costInEth = Number(ethers.formatEther(costInWei));
    
    const gasCostUsd = costInEth * ETH_PRICE;

    console.log(` Economics: Fee Earned $${platformFeeUsd.toFixed(4)} vs Gas Cost $${gasCostUsd.toFixed(4)}`);

    // 4. THE KILL SWITCH
    // If we aren't making at least 1 cent profit, reject the relay.
    if (gasCostUsd > (platformFeeUsd - 0.01)) {
        return NextResponse.json({ 
            error: "Network congested. Please try again later or pay gas manually." 
        }, { status: 429 });
    }

    // 5. Execute if Profitable
    // 5. Execute if Profitable
    const tx = await contract.buyLink(
        slug, userAddress, PLATFORM_FEE_RECIPIENT, NEXT_PUBLIC_FEE_BPS,
        { value: priceWei }
    );
    
    return NextResponse.json({ success: true, txHash: tx.hash });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}