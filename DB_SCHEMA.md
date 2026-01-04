# DB_SCHEMA.md - Supabase Structure & Security

## 1. Overview
* **Database:** Supabase (PostgreSQL).
* **Purpose:**
    * `links`: The "Indexer" for the Smart Contract. Handles the lifecycle of a product.
    * `link_reports`: Stores weighted user votes for the "Safe Harbor" moderation system.
    * `review_queue`: An Admin View for quick decision-making.

## 2. Tables

### Table: `links`
* **Description:** Public index of created links with moderation status.
* **Columns:**
    * `id` (text, Primary Key): The `slug` (e.g., "brave-blue-lion").
    * `id_hash` (text): The `keccak256` hash used in the contract.
    * `creator` (text): Wallet address of creator.
    * `price_usd` (numeric): Display price in USD.
    * `price_eth` (numeric/text): Derived ETH equivalent at creation.
    * `ipfs_hash` (text): The encrypted content pointer.
    * `created_at` (timestamp): Default `now()`.
    * **`status`** (text): Default `'active'`.
        * `'active'`: Publicly discoverable and buyable.
        * `'flagged'`: Auto-set by Trigger. Hidden from new buyers (Soft 404/Warning). Visible to existing owners.
        * `'hidden'`: Auto-set by Trigger (Tier 2). Content inaccessible to everyone until review.
        * `'banned'`: Manually set by Admin. Permanent removal.
* **RLS Policies:**
    * **Read:** Public can read rows where `status` is NOT 'banned'. (Frontend handles the "Flagged" UI gating).
    * **Insert:** Authenticated users can insert.
    * **Update:** ONLY the Service Role (Admin) or Database Triggers can update `status`. Creator can update metadata.

### Table: `link_reports`
* **Description:** Weighted moderation queue.
* **Columns:**
    * `id` (int8, Primary Key).
    * `slug` (text): Foreign Key to `links.id` (ON DELETE CASCADE).
    * **`reporter_address`** (text): Wallet address of the reporter.
    * **`is_buyer`** (bool): `true` if reporter holds the access token (Weight: 2). `false` otherwise (Weight: 1).
    * `reason` (text): The specific complaint (e.g., "Malware", "Scam").
    * `created_at` (timestamp): Default `now()`.
* **Constraints:**
    * **Unique Index:** `(slug, lower(reporter_address))` — Prevents "0xABC" and "0xabc" from voting twice on the same link.
* **RLS Policies:**
    * **Read:** ONLY Service Role (Admin).
    * **Insert:** Authenticated users only.

## 3. Database Views

### View: `review_queue`
* **Description:** A read-only dashboard for the Admin to see flagged content.
* **Query Logic:**
    * Aggregates `link_reports` by `slug`.
    * Calculates `weighted_score` (Sum of: Buyer=2, Others=1).
    * Arrays all `reasons` into a single readable column.
    * Filters for `status IN ('flagged', 'active')`.

## 4. Automation (Triggers)

**Function:** `check_moderation_threshold()`
* **Trigger:** Runs `AFTER INSERT` on `link_reports`.
* **Security:** `SECURITY DEFINER` (Runs with Admin privileges).
* **Logic:**
    1. Calculates total weighted score for the `slug`.
    2. **Tier 1 (Score ≥ 4):** If `status` is 'active', update to `'flagged'`.
    3. **Tier 2 (Score ≥ 8, Optional):** Can be configured to auto-hide heavily reported content.

## 5. Security Rules (Checklist)
* [x] **RLS Enabled** on all tables.
* [x] **Input Sanitization:** All `reporter_address` inputs must be lowercased before Insert.
* [x] **Identity:** Reporting requires wallet signature (Authenticated), preventing anonymous bot spam.