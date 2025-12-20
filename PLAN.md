LinkLockr Engineering Context


1. Project Overview & Philosophy

    Goal: A decentralized "Link Vending Machine" on Base. Users encrypt URLs (via Lit Protocol) and sell access for USDC.

    Core Philosophy: "Ownerless Protocol, Managed Interface."

    The Protocol: A free, open-source public utility on the blockchain. Defaults to 0% fees. No owner, no admin keys.

    The Interface: A value-add website (linklockr.xyz) that provides a UI, slug generation, and moderation. It charges a 5% "Convenience Fee" via frontend parameters.

    Target Audience: Micro-creators selling files, templates, or private content.


2. Tech Stack & Constraints

    Frontend: Next.js 15 (App Router), Tailwind CSS, Lucide React.

    Blockchain: Base Mainnet.

    Smart Contract: Solidity 0.8.20, OpenZeppelin ERC1155.

    Web3 Libraries: ethers.js v6 (Strictly v6), @privy-io/react-auth, @lit-protocol/lit-node-client.

    Database (Moderation): Supabase (Postgres) for reporting/flagging only.

    Payment: USDC on Base (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913).


3. Smart Contract Architecture (The Protocol)

    Pattern: "Ownerless" / "Slug-Based ID" / "Frontend-Defined Fees" 
    Status: Final Production Candidate

    Identifier Strategy:

        Slug: Human-readable string (e.g., silly-pink-panda or my-custom-link).

        Storage Key: keccak256(slug) (bytes32).

        Access Token: ERC-1155 Token ID = uint256(keccak256(slug)).

    Fee Logic (The "Public Good" Model):

        Default: 0% (Free).

        Max Cap: 5% (500 bps) hardcoded safety limit.

        Control: The caller (Frontend) decides the fee recipient and %.

        Admin Powers: NONE. No Ownable, no pause(), no blacklist().

    Functions:

        createLink(string _slug, uint256 _price, string _ipfsHash)

        buyLink(string _slug, address _recipient) -> 0% Fee (Direct/Public usage).

        buyLink(string _slug, address _recipient, address _feeRecipient, uint256 _feeBps) -> Dynamic Fee (Interface usage).


4. Frontend & UX Specifications (The Interface)

    A. URL Structure & Routing

        Route: /buy/[slug]/page.tsx (Catch-all or dynamic route).

        Lookup Logic:

            1. User visits linklockr.xyz/brave-blue-lion.

            2. App computes hash: const id = ethers.id('brave-blue-lion').

            3. App queries Contract: links[id].

            4. If links[id].active is false -> 404 Page.

    B. "Create" Flow (Hybrid Slugs)

        Library: unique-names-generator.

        Default State: Auto-generate a random 3-word slug (e.g., brave-blue-lion) on page load.

        User Action:

            Re-roll: Button to generate a new random slug.

            Custom: User can type over it for a vanity slug (e.g., my-cool-file).

        Validation: Check contract to ensure links[keccak256(slug)] does not exist.

    C. "Buy" Flow (Fee Injection)

        Env Variables:

            NEXT_PUBLIC_PLATFORM_WALLET: The address receiving fees.

            NEXT_PUBLIC_FEE_BPS: Set to 250 (2.5%).

        Contract Call:

            The frontend MUST call the 4-argument buyLink to capture revenue.

            contract.buyLink(slug, userAddr, process.env.NEXT_PUBLIC_PLATFORM_WALLET, 500)

        Kill Switch: If regulatory issues arise, setting NEXT_PUBLIC_PLATFORM_WALLET to "" or 0x000... in Vercel immediately stops revenue collection without redeploying code.


5. Legal & Moderation System (The Safety Valve)

    Goal: Mitigate Vicarious Infringement & Liability via Interface-level controls.

    A. The "Blur Strategy" (Reporting)

        Database: Supabase table link_reports(slug_hash, report_count, status).

        Frontend Logic:

            1 Unique Report: Change the link description (on the /buy/ page) to: "Content flagged for review. Purchase at your own risk."

            3 Unique Reports: Hard Hide. "Content Under Review." Buy button disabled. (Takedown).

        Admin Whitelist: Manual override in Supabase to restore/ban.

    B. Terms of Service

        Requirement: Mandatory Clickwrap checkbox before createLink tx.

        Clause: "Slugs and Content are immutable. User indemnifies Platform. Platform reserves right to hide any content from the Interface."


6. Implementation Checklist

    [ ] Smart Contract: Deploy LinkLockr_Ownerless.sol to Base Mainnet.

    [ ] Env Vars: Configure NEXT_PUBLIC_PLATFORM_WALLET and FEE_BPS.

    [ ] Frontend: Implement CreatePage with unique-names-generator.

    [ ] Frontend: Update buyLink call to pass the 4 arguments (Slug, User, Wallet, Bps).

    [ ] Frontend: Implement [slug]/page.tsx using ethers.id() for lookups.

    [ ] Supabase: Initialize link_reports table & Edge Function for reporting.