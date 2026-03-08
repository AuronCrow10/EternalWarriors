# Eternal Warriors Backend - Web3 Gameplay API

This repository contains a production-style Node.js backend used for the **Eternal Warriors** NFT game flow.  
It connects **on-chain NFT state** (via `ethers.js`) with **off-chain progression data** (via MySQL), exposing HTTP endpoints consumed by a web client.

## Project Highlights

- Built a Web3 gameplay backend that bridges smart contracts and SQL progression logic.
- Implemented secure wallet/NFT verification and server-side game mechanics.
- Designed API flows for mint/template generation, hunting, leveling, and evolution.
- Integrated on-chain writes (signed transactions) with transactional off-chain updates.
- Applied production-oriented security controls (CSP, CORS restrictions, env-based secrets).

## Problem This Project Solves

Blockchain is excellent for ownership and verifiable actions, but game logic often needs fast, relational, and transaction-safe data handling off-chain.

This project addresses that gap by:

- Verifying NFT ownership and chest/template eligibility on-chain.
- Generating template outcomes using weighted probabilities stored in SQL.
- Running gameplay loops (hunt, level-up, evolve) with deterministic server-side rules.
- Writing battle history and player progression to a relational database.
- Triggering smart-contract state changes when conditions are met.

In short: it is a practical hybrid architecture for a Web3 game where **wallet/NFT truth lives on-chain** and **game progression/statistics live off-chain**.

## What This Demonstrates (Recruiter View)

- Backend API design with Express for game actions.
- Smart contract integration (`ethers` v6): reads + signed transactions.
- SQL data modeling and transaction handling (`mysql2/promise`).
- Weighted random selection and probabilistic game mechanics.
- Production-minded security setup (`helmet`, strict CORS, env-based secrets).
- Real deployment wiring (IIS reverse proxy config in `web.config`).

## Tech Stack

- Node.js + Express
- MySQL (`mysql2`)
- `ethers.js` for EVM smart contract interaction
- `dotenv`, `cors`, `helmet`
- Static frontend assets served from `public/`

## High-Level Architecture

1. Client calls game endpoint (`/generate-template`, `/hunt`, `/level-up`, etc.).
2. API validates request and, when needed, checks NFT ownership/state on-chain.
3. API reads/writes gameplay state in MySQL (`users`, `hunting_history`, `nft_characters_traits`).
4. API optionally submits signed blockchain transactions (open chest, level template, evolve/airdrop).
5. API returns gameplay result + transaction hash data.

## Core Gameplay Flows

### 1) Generate Template (`POST /generate-template`)

- Verifies NFT + active chest status through the contract.
- Pulls eligible templates from DB based on chest/class group.
- Performs weighted random template selection.
- Stores new player record if wallet is first-time.
- Calls on-chain `openChest` and returns `templateID` + `txHash`.

### 2) Hunt (`POST /hunt`)

- Confirms wallet is owner of NFT and that NFT has a valid template.
- Computes score from randomness + character data.
- Maps score to rewards.
- Inserts battle log and updates user points in a DB transaction.

### 3) Level Up + Evolution (`POST /level-up`)

- Checks if level-up is available on-chain.
- Advances template to next level based on DB lookup.
- Performs rare evolution chance logic.
- If evolution succeeds, triggers NFT evolution/airdrop transaction.

### 4) Player Insights

- `POST /get-hunt-time`: cooldown/time-left data.
- `POST /hunt-history`: full hunt log for wallet.
- `POST /get-stats`: total battles + points.

## API Endpoints

- `POST /generate-template` -> `{ address, nftId }`
- `POST /level-up` -> `{ nftId }`
- `POST /hunt` -> `{ address, nftId }`
- `POST /get-hunt-time` -> `{ nftId }`
- `POST /hunt-history` -> `{ address }`
- `POST /get-stats` -> `{ address }`

## Data Model Dependencies

The current code expects at least these tables:

- `users` (`UserID`, `wallet_address`, `Points`)
- `hunting_history` (`UserID`, `BattleTime`, `Result`, `Points`, `NftID`)
- `nft_characters_traits` (`nft_character_id`, `probability`, `level_id`, `class_group_id`, `class_rarity`, `race_id`, `class_id`, `class_rank`, `rarity`)

## Local Setup

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

Copy `.env.example` to `.env` and fill real values:

```bash
cp .env.example .env
```

PowerShell alternative:

```powershell
Copy-Item .env.example .env
```

### 3) Run server

```bash
npm start
```

Server runs on `http://localhost:3000` by default.

## Environment Variables

See `.env.example` for all keys:

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `PRIVATE_KEY` (signer wallet)
- `PROVIDER_URL` (RPC endpoint)
- `PORT`
- `FRONTEND_URL` (optional reference)
- `contractAddress` (optional; current code uses a hardcoded address)

## GitHub Upload Checklist (Sensitive Data Safety)

1. Keep your real `.env` local only (already ignored by `.gitignore`).
2. Commit only `.env.example` for configuration guidance.
3. If `.env` was ever tracked before, untrack it:

```bash
git rm --cached .env
```

4. Before pushing, verify staged files do not contain secrets:

```bash
git status
git diff --cached
```

## Security Notes

- Secrets are loaded from `.env` and should never be committed.
- CORS is currently restricted to `https://eternalwarriors.io`.
- CSP is configured via `helmet`.
- Blockchain writes require a funded private key account.

## Deployment Note

`web.config` includes IIS rewrite rules for:

- HTTP -> HTTPS redirect
- Reverse proxy to Node (`localhost:3000`)
- CORS header passthrough for the production domain

## Potential Improvements

- Add automated tests for route + gameplay logic.
- Move hard-coded origin/contract address to environment config.
- Add request validation (e.g., `zod`/`joi`) and structured error codes.
- Add rate limiting and audit logging.
