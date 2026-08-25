# TRACE

Product recall & supply chain investigation — Wexa AI take-home.

When a batch is compromised, TRACE walks the supply-chain graph to show production impact, affected products, shipments, orders, and customers.

## Stack

- Next.js (App Router) + TypeScript + Tailwind
- CognoDB via official Neo4j JavaScript driver
- React Flow for graph visualization
- Vercel-ready deployment

## Graph model

```text
Supplier -[:SUPPLIES]-> Material -[:HAS_BATCH]-> MaterialBatch
  -[:USED_IN]-> ProductionBatch -[:PRODUCES]-> Product
  -[:SHIPPED_IN]-> Shipment -[:FULFILLS]-> Order -[:PLACED_BY]-> Customer

QualityEvent -[:AFFECTS]-> MaterialBatch
```

Hero demo path: **QE-001 / RM-2047** contamination investigation.

## Setup

1. Create a CognoDB free instance and copy the Bolt URI + password.
2. Configure env:

```bash
cp .env.example .env.local
```

```env
COGNODB_URI=bolt+s://<instance-id>.databases.cognodb.cloud
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=<secret>
```

3. Install, seed, run:

```bash
npm install
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local app |
| `npm run seed` | Wipe + load demo graph |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

## Notes

- All Cypher uses parameters — never string-concatenated user input.
- UI never talks to CognoDB directly; only API / server code uses the driver.
- Seed always recreates the QE-001 → RM-2047 impact path for demos.
