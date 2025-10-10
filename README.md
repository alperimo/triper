# Triper 🗺️✨

> Privacy-preserving travel companion matching using Arcium's encrypted compute

**Built for**: [Arcium Cypherpunk Hackathon 2025](https://arcium.com)  
**Track**: Encrypted Side Track  
**Deadline**: October 30, 2025

---

## 🎯 What is Triper?

Triper helps travelers find compatible companions **without revealing their exact location or personal details**. Using Arcium's Multi-Party Computation (MPC), your travel plans remain encrypted while the system finds matches based on:

- 📍 **Route Overlap** - Encrypted grid-based location matching (~10km cells)
- 📅 **Date Overlap** - Temporal intersection of travel dates
- 🎒 **Shared Interests** - Travel style compatibility (backpacking, luxury, adventure, etc.)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **pnpm** 8+ (`npm install -g pnpm`)
- **Rust** 1.79+ ([rustup.rs](https://rustup.rs/))
- **Solana CLI** ([install guide](https://docs.solana.com/cli/install-solana-cli-tools))
- **Anchor** 0.30+ (`cargo install --git https://github.com/coral-xyz/anchor avm --locked && avm install 0.30.1 && avm use 0.30.1`)
- **Solana Wallet** (e.g., [Phantom](https://phantom.app/))

### Installation

```bash
# Clone and navigate
cd triper

# Install all dependencies
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build Smart Contracts

```bash
# Build Rust contracts
pnpm contracts:build

# Test contracts
pnpm contracts:test

# Deploy to devnet
pnpm contracts:deploy
```

---

## 📁 Monorepo Structure

```
triper/
├── apps/
│   └── web/                    # Next.js frontend application
│       ├── src/
│       │   ├── app/           # Next.js App Router pages
│       │   ├── components/    # React components
│       │   ├── lib/           # Utilities & state management
│       │   └── types/         # TypeScript types
│       └── package.json
│
├── packages/
│   ├── contracts/             # Solana/Arcium smart contracts
│   │   ├── programs/
│   │   │   └── triper/       # Main Rust program
│   │   │       ├── src/
│   │   │       │   └── lib.rs  # Contract logic with MPC
│   │   │       └── Cargo.toml
│   │   ├── Anchor.toml        # Anchor configuration
│   │   └── Cargo.toml
│   │
│   ├── sdk/                   # Shared TypeScript SDK (future)
│   └── types/                 # Shared type definitions (future)
│
├── pnpm-workspace.yaml        # pnpm monorepo config
├── turbo.json                 # Turborepo build config
├── package.json               # Root package with scripts
└── README.md                  # This file
```

---

## 🔧 Tech Stack

### Frontend (`apps/web`)
- **[Next.js 15](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first styling
- **[Framer Motion](https://www.framer.com/motion/)** - Declarative animations
- **[Zustand](https://github.com/pmndrs/zustand)** - Lightweight state management
- **[Maplibre GL JS](https://maplibre.org/)** - Open-source map rendering
- **[@solana/wallet-adapter](https://github.com/solana-labs/wallet-adapter)** - Wallet integration

### Smart Contracts (`packages/contracts`)
- **[Anchor](https://www.anchor-lang.com/)** - Solana framework for Rust
- **[Arcium SDK](https://arcium.com/)** - MPC compute primitives
- **[Solana](https://solana.com/)** - High-performance blockchain

### Monorepo Tools
- **[pnpm](https://pnpm.io/)** - Fast, disk-efficient package manager
- **[Turborepo](https://turbo.build/)** - High-performance build system

---

## 🏗️ How It Works

### Architecture Overview

```
┌─────────────┐
│   User A    │──┐
└─────────────┘  │
                 ├──> Client-side Encryption
┌─────────────┐  │    (Grid cells, dates, interests)
│   User B    │──┘
└─────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Solana Blockchain (Devnet)         │
│  - Store encrypted trip data        │
│  - Manage match records             │
│  - Handle consent flow               │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Arcium MPC Network                 │
│  #[confidential] compute_match()    │
│  - Decrypt in secure enclave        │
│  - Calculate compatibility          │
│  - Return encrypted results         │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Frontend Map Visualization         │
│  - Show encrypted "auras"           │
│  - Animated match indicators        │
│  - Progressive reveal on consent    │
└─────────────────────────────────────┘
```

### Privacy Grid System

```
Exact Location:     Grid Cell (0.1° = ~10km):
  [52.5200, 13.4050]  →  [52.5, 13.4]
  
Your route: [Berlin, Prague, Vienna]
Encrypted:  [5250_1340, 5007_1447, 4820_1637]

This obfuscates exact position while enabling proximity matching.
```

### Matching Algorithm (MPC)

The `compute_match()` function runs inside Arcium's secure MPC environment:

```rust
#[confidential]  // Arcium decorator
pub fn compute_match(
    trip_a_route: Vec<u32>,      // Decrypted ONLY in enclave
    trip_a_dates: [i64; 2],
    trip_a_interests: Vec<u8>,
    trip_b_route: Vec<u32>,
    trip_b_dates: [i64; 2],
    trip_b_interests: Vec<u8>,
) -> Result<MatchResult> {
    // 1. Route overlap (40% weight)
    let route_score = calculate_route_overlap(...);
    
    // 2. Date overlap (30% weight)
    let date_score = calculate_date_overlap(...);
    
    // 3. Interest similarity (30% weight)
    let interest_score = calculate_interest_similarity(...);
    
    // Return encrypted match score
}
```

**Key**: Neither user sees the other's unencrypted data. Only the final match score is revealed.

---

## 🎨 Design Philosophy

### Why "Auras"?

Traditional location sharing is binary: reveal everything or nothing. Triper introduces **gradual disclosure**:

1. **Encrypted Aura** (default): Glowing circle on map showing a match exists
2. **Distance Range** (hover): "15-20km away" without exact location  
3. **Match Score** (click): Percentage compatibility
4. **Full Reveal** (mutual consent): Exchange actual travel details

This creates intrigue while preserving safety.

### Visual Language
- 🌟 **Glow Effects**: Encrypted data radiating outward
- 💓 **Pulsing**: High-match auras "breathe" to draw attention
- 🎨 **Purple/Pink Gradient**: Crypto/Web3 aesthetic
- 🔒 **Lock Icons**: Constant encryption reminder

---

## 📊 Development Status

### ✅ Completed (Phase 1)
- [x] Monorepo structure with pnpm + Turborepo
- [x] Next.js frontend with TypeScript
- [x] Wallet integration (Phantom/Solana)
- [x] Landing page + dashboard UI
- [x] Map visualization (Maplibre)
- [x] Animated encrypted auras
- [x] Privacy grid system (0.1° cells)
- [x] State management (Zustand)
- [x] Smart contract scaffold (Anchor/Rust)
- [x] MPC matching algorithm structure

### 🚧 In Progress (Phase 2)
- [ ] Trip creation UI (map-based route builder)
- [ ] Arcium SDK integration
- [ ] Contract deployment to devnet
- [ ] End-to-end encryption flow
- [ ] Match reveal modal

### 📋 TODO (Phase 3)
- [ ] Testing with multiple wallets
- [ ] Chat/messaging system
- [ ] Mobile responsiveness
- [ ] Demo video
- [ ] Production deployment

---

## 🧪 Development Commands

### Root (Monorepo)
```bash
pnpm dev                 # Start Next.js dev server
pnpm build               # Build all packages
pnpm lint                # Lint all packages
pnpm test                # Run all tests
pnpm clean               # Clean all build artifacts
```

### Web App
```bash
cd apps/web
pnpm dev                 # Next.js dev server
pnpm build               # Production build
pnpm start               # Start production server
```

### Smart Contracts
```bash
cd packages/contracts
pnpm build               # Compile Rust contracts
pnpm test                # Run Anchor tests
pnpm deploy              # Deploy to configured cluster
pnpm deploy:devnet       # Deploy to Solana devnet
```

---

## 🔐 Privacy Architecture

### What's Encrypted?
- ✅ Exact coordinates (only grid cells stored)
- ✅ Route waypoints
- ✅ Travel dates
- ✅ Personal interests
- ✅ User identity (until reveal)

### What's Public?
- ⚠️ General grid region (~10km precision)
- ⚠️ Match score (no identifiable info)
- ⚠️ Wallet address (pseudo-anonymous)

### Data Flow
```
Client → Encrypt → Solana → Arcium MPC → Match Score → Client
         (local)   (store)  (compute)    (encrypted)   (display)
```

---

## 🌐 Deployment

### Frontend (Vercel)
```bash
cd apps/web
vercel
```

### Contracts (Solana Devnet)
```bash
cd packages/contracts
anchor deploy --provider.cluster devnet
```

Update `apps/web/.env.local` with deployed program ID.

---

## 🤝 Contributing

This is a hackathon project built for **Arcium Cypherpunk Hackathon 2025**.

### Future Roadmap
- [ ] Mobile app (React Native)
- [ ] Group trip matching (3+ travelers)
- [ ] Integration with booking platforms
- [ ] On-chain reputation system
- [ ] AI itinerary suggestions
- [ ] Multi-chain support

---

## 📚 Resources

- [Arcium Documentation](https://docs.arcium.com/)
- [Solana Developer Docs](https://docs.solana.com/)
- [Anchor Book](https://book.anchor-lang.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [pnpm Documentation](https://pnpm.io/)

---

## 🎯 Hackathon Pitch

**Problem**: Travelers want companions but fear:
- 🚨 Location exposure to strangers
- 🚨 Public travel plan sharing
- 🚨 Identity reveal before trust

**Solution**: Arcium MPC enables matching on **encrypted data**—no centralized server sees unencrypted information.

**Market**: 1.5B international travelers/year, growing solo travel trend, safety concerns.

**Unique Value**: First privacy-preserving travel matcher using MPC. Visual "auras" create intrigue. Web3-native with on-chain reputation.

---

## 📄 License

MIT License - See LICENSE file

---

## 🙏 Acknowledgments

- **Arcium Team** - Encrypted compute infrastructure
- **Solana Foundation** - High-performance blockchain
- **Anchor** - Solana development framework
- **OpenStreetMap** - Open map data

---

**Built with ❤️ for Arcium Cypherpunk Hackathon 2025**

*19 days remaining until deadline (October 30, 2025)*
