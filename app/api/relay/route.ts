import { NextResponse } from "next/server";
import { ethers } from "ethers";

// CONFIG
const PRIVATE_KEY = process.env.NEXT_PUBLIC_RELAYER_PRIVATE_KEY!;
const RPC_URL = "https://mainnet.base.org"; // Or Alchemy/Infura
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ""; 
const PLATFORM_FEE_RECIPIENT = process.env.NEXT_PUBLIC_PLATFORM_FEE_RECIPIENT || ""; 
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"; // Base USDC

const ABI = [
  "function buyLink(string _slug, address _recipient, address _feeRecipient, uint256 _feeBps) external"
];

// const USDC_ABI = [
//     "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
//     "function allowance(address owner, address spender) view returns (uint256)"
// ];

const USDC_ABI = [
    "function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external",
    "function allowance(address owner, address spender) view returns (uint256)"
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
    const { slug, userAddress, price, permit } = await req.json();

    // 1. Setup Wallet & Contract
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);

    // 2. HANDLE PERMIT (if provided)
    if (permit) {
        console.log("Submitting Permit...");
        // Relayer pays gas for this:
        const txPermit = await usdc.permit(
            userAddress,            // Owner
            CONTRACT_ADDRESS,       // Spender (Your Link Contract)
            ethers.MaxUint256,      // Value
            permit.deadline,
            permit.v,
            permit.r,
            permit.s
        );
        // CRITICAL: Must wait for permit to confirm before buying
        await txPermit.wait();
    }

    // 3. CALCULATE PROFITABILITY
    const NEXT_PUBLIC_FEE_BPS = process.env.NEXT_PUBLIC_FEE_BPS
        ? parseInt(process.env.NEXT_PUBLIC_FEE_BPS)
        : 500; // Default to 500 bps (5%);
    const decimalFeeBps = NEXT_PUBLIC_FEE_BPS / 10000;
    const platformFee = price * decimalFeeBps;
    
    // Estimate the gas needed for this specific buy
    const gasLimit = await contract.buyLink.estimateGas(
        slug, userAddress, PLATFORM_FEE_RECIPIENT, NEXT_PUBLIC_FEE_BPS
    );
    
    // Get current gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(100000000); // Default 0.1 gwei
    
    // Calculate total cost in ETH
    const costInWei = gasLimit * gasPrice;
    const costInEth = Number(ethers.formatEther(costInWei));
    
    const ETH_PRICE = await fetchEthPriceUsd(); 
    const gasCostUsd = costInEth * ETH_PRICE;

    console.log(` Economics: Fee Earned $${platformFee.toFixed(4)} vs Gas Cost $${gasCostUsd.toFixed(4)}`);

    // 4. THE KILL SWITCH
    // If we aren't making at least 1 cent profit, reject the relay.
    if (gasCostUsd > (platformFee - 0.01)) {
        return NextResponse.json({ 
            error: "Network congested. Please try again later or pay gas manually." 
        }, { status: 429 });
    }

    // 5. Execute if Profitable
    const tx = await contract.buyLink(
        slug, userAddress, PLATFORM_FEE_RECIPIENT, NEXT_PUBLIC_FEE_BPS
    );
    
    return NextResponse.json({ success: true, txHash: tx.hash });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}