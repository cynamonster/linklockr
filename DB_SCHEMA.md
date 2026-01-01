# DB_SCHEMA.md - Supabase Structure & Security

## 1. Overview
* **Database:** Supabase (PostgreSQL).
* **Purpose:**
    * `links`: Acts as an "Indexer" for the Smart Contract. Used to populate the "Recent" or "Discover" feeds without querying the blockchain 1000 times.
    * `link_reports`: Stores user flags for moderation.

## 2. Tables

### Table: `links`
* **Description:** Public index of created links.
* **Columns:**
    * `id` (text, Primary Key): The `slug` (e.g., "brave-blue-lion").
    * `id_hash` (text): The `keccak256` hash used in the contract.
    * `creator` (text): Wallet address of creator.
    * `price_usd` (numeric): Display price entered by the seller in USD (e.g. 5.00).
    * `price_eth` (numeric/text): Derived ETH equivalent at time of creation (e.g. "0.001234"). Stored so buyers and indexers can show the ETH amount used for on-chain payment. Consider numeric(36,18) or text for precision.
    * `ipfs_hash` (text): The encrypted content pointer.
    * `created_at` (timestamp): Default `now()`.
    * `active` (bool): Default `true`. Set to `false` if hidden by admin.
* **RLS Policies:**
    * **Read:** Public (Anon) can read where `active = true`.
    * **Insert:** Authenticated users can insert.
    * **Update:** ONLY the creator or Service Role can update.

### Table: `link_reports`
* **Description:** Moderation queue.
* **Columns:**
    * `id` (int8, Primary Key).
    * `slug` (text): Foreign Key to `links.id`.
    * `reporter_ip` (text): Hashed IP for rate limiting.
    * `reason` (text): "Copyright", "Malware", etc.
    * `created_at` (timestamp).
* **RLS Policies:**
    * **Read:** ONLY Service Role (Admin).
    * **Insert:** Public (Anon) can insert (Rate limited via Edge Function).

## 3. Security Rules (RLS)
* **Never** allow public `DELETE` on any table.
* **Never** expose `link_reports` to the public client.

## 4. Edge Functions
* `report-link`:
    * **Input:** `{ slug, reason }`
    * **Logic:**
        1. Check `link_reports` to see if this IP has already reported this slug (Prevent spam).
        2. Insert new row into `link_reports`.
        3. Count total reports for this `slug`.
        4. **IF count >= 3:**
            * Update `links` table: SET `active = false`.
            * Return: `{ success: true, message: "Link under review" }`.