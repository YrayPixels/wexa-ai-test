Absolutely. Since you want the actual `.md` file, I can still give you the complete document here, but the file-generation tool is currently unavailable, so I can't attach a generated file in this response.

I've structured it as a combined **PRD + Architecture Document** for **TRACE**, ready to save as `TRACE_PRD_Architecture.md`.

````md
# TRACE

## Product Recall & Supply Chain Investigation

> When something goes wrong, find where it came from and everything it could affect.

**Version:** 1.0  
**Status:** MVP / Wexa AI Take-Home Assignment  
**Database:** CognoDB  
**Driver:** Official Neo4j JavaScript Driver  
**Frontend:** Next.js + TypeScript  
**Graph Visualization:** React Flow  
**Deployment:** Vercel

---

# 1. Product Overview

TRACE is a graph-backed investigation application for manufacturers and quality/operations teams.

When a supplier, ingredient batch, component, production run, or finished product is suspected of being defective, the user needs to determine:

- Where the affected material came from
- Which production batches used it
- Which finished products were produced from those batches
- Where those products were shipped
- Which customers/orders may be affected
- Which other products share the same upstream dependency

TRACE models this supply-chain genealogy as a graph and allows a non-technical user to investigate the impact of a quality event through visual graph traversal.

---

# 2. Problem Statement

Manufacturing data is naturally connected.

A finished product may depend on:

```text
Supplier
    ↓
Material
    ↓
Material Batch
    ↓
Production Batch
    ↓
Finished Product
    ↓
Shipment
    ↓
Customer Order
    ↓
Customer
```
````

When a quality incident occurs, the difficult question isn't:

> "What is the status of this batch?"

The difficult questions are:

> "What did this batch become?"

> "Where did those products go?"

> "Who might have received them?"

> "Where did this defective product originate?"

> "Which other products share the same upstream dependency?"

These are relationship and path questions.

TRACE exists to answer them quickly.

---

# 3. Product Goal

Build a focused investigation tool that allows a quality manager to understand the blast radius of a manufacturing quality event.

The MVP allows a user to:

1. Select an affected batch or quality event.
2. Trace its downstream impact.
3. Identify affected production batches.
4. Identify affected finished products.
5. Identify affected shipments and customer orders.
6. Explore the supply-chain graph visually.
7. Trace a product backwards to its source.
8. Find common upstream dependencies.
9. Understand the impact through clear counts and paths.

---

# 4. Primary User

## Quality / Operations Manager

The primary user is a non-technical employee responsible for investigating quality incidents.

They should not need to understand:

- Cypher
- Graph databases
- Neo4j
- CognoDB
- Application architecture

Their mental model is simply:

> "We discovered a defective batch. What is affected?"

---

# 5. Core Use Case

## Product Recall Investigation

A manufacturer discovers that ingredient batch:

**RM-2047**

may be contaminated.

The quality manager needs to determine:

- Which production batches used RM-2047?
- Which products were created?
- Where are those products?
- Which shipments contain them?
- Which customer orders could be affected?
- Which supplier/material is responsible?

TRACE performs the investigation by traversing the graph.

### Example

```text
Ingredient Batch RM-2047
          ↓
Production Batches
          ↓
Finished Products
          ↓
Shipments
          ↓
Customer Orders
          ↓
Customers
```

The application could report:

```text
4 Production Batches
7 Products
27 Shipments
142 Orders
118 Customers
```

---

# 6. Secondary Use Cases

## 6.1 Backward Traceability

Start with a finished product and determine:

> "Where did this product come from?"

```text
Product
  ↑
Production Batch
  ↑
Ingredient Batch
  ↑
Ingredient
  ↑
Supplier
```

---

## 6.2 Common Upstream Dependency

Select multiple affected products and ask:

> "What do these products have in common?"

Example:

```text
Product A ─┐
Product B ─┼──> Ingredient Batch RM-2047
Product C ─┘
```

---

## 6.3 Impact Radius

Determine how far a quality incident has propagated.

```text
Batch
 ↓
Production
 ↓
Products
 ↓
Shipments
 ↓
Orders
 ↓
Customers
```

---

# 7. Non-Goals

The MVP will NOT attempt to build:

- Full ERP functionality
- Inventory management
- Procurement
- Warehouse management
- Manufacturing execution
- Real-time IoT ingestion
- Customer relationship management
- Automated regulatory filing
- Production-grade authentication
- Multi-tenancy
- AI chatbot functionality

The objective is to solve one investigation problem extremely well.

---

# 8. Core Product Experience

## Dashboard

The user lands on a dashboard showing active quality events.

Example:

```text
TRACE

Product Recall & Supply Chain Investigation

Active Investigations

┌────────────────────────────────────────────┐
│ ⚠ CRITICAL                                │
│ Ingredient Batch RM-2047                  │
│ Contamination Investigation               │
│                                            │
│ 7 Products · 27 Shipments · 142 Orders   │
│                                            │
│ [ Investigate Impact ]                    │
└────────────────────────────────────────────┘
```

---

# 9. Investigation Workflow

## Step 1 — Select Event

The user selects a quality event.

Example:

```text
Contamination
RM-2047
Critical
```

---

## Step 2 — Trace Impact

TRACE runs the downstream graph traversal.

```text
RM-2047
   ↓
4 Production Batches
   ↓
7 Products
   ↓
27 Shipments
   ↓
142 Orders
```

---

## Step 3 — Explore Graph

The user can view the graph visually.

Example:

```text
                    RM-2047
                       │
              ┌────────┼────────┐
              ↓        ↓        ↓
           PB-331   PB-334   PB-341
              │        │        │
              ↓        ↓        ↓
          Product   Product   Product
              │        │        │
              ↓        ↓        ↓
          Shipment  Shipment  Shipment
```

Nodes are clickable.

---

## Step 4 — Inspect Entity

Clicking a node opens its details.

Example:

```text
PRODUCT

P-102
Industrial Controller

SKU
CTRL-102

Production Batch
PB-331

Produced
18 Aug 2026

Status
⚠ Recall Review

[ Trace Upstream ]
```

---

# 10. Upstream Investigation

Click:

**Trace Upstream**

The user sees:

```text
P-102
  ↑
PB-331
  ↑
RM-2047
  ↑
Industrial Motor Housing
  ↑
Apex Components
```

This answers:

> "Why is this product affected?"

---

# 11. Graph Data Model

## Nodes

### Supplier

```text
(:Supplier {
  id,
  name,
  location
})
```

### Ingredient

```text
(:Ingredient {
  id,
  name,
  category
})
```

### IngredientBatch

```text
(:IngredientBatch {
  id,
  batchNumber,
  manufactureDate,
  expiryDate,
  status
})
```

### ProductionBatch

```text
(:ProductionBatch {
  id,
  batchNumber,
  productionDate,
  facility
})
```

### Product

```text
(:Product {
  id,
  sku,
  name,
  category
})
```

### Warehouse

```text
(:Warehouse {
  id,
  name,
  location
})
```

### Shipment

```text
(:Shipment {
  id,
  shippedAt,
  quantity,
  status
})
```

### Order

```text
(:Order {
  id,
  orderNumber,
  orderDate,
  status
})
```

### Customer

```text
(:Customer {
  id,
  name,
  region
})
```

### QualityEvent

```text
(:QualityEvent {
  id,
  type,
  description,
  severity,
  reportedAt,
  status
})
```

---

# 12. Relationship Model

```text
Supplier
   │
   └── SUPPLIES ──────────> Ingredient
                                │
                           HAS_BATCH
                                ↓
                         IngredientBatch
                                │
                             USED_IN
                                ↓
                         ProductionBatch
                                │
                            PRODUCES
                                ↓
                            Product
                                │
                           CONTAINS_IN
                                ↓
                           Shipment
                                │
                            FULFILLS
                                ↓
                             Order
                                │
                           PLACED_BY
                                ↓
                            Customer
```

Quality events:

```text
QualityEvent
     │
   AFFECTS
     ↓
IngredientBatch
```

---

# 13. Why a Graph Database?

TRACE is intentionally designed around relationships.

The core questions are:

- What does this batch affect?
- Where did this product originate?
- Which customers are connected to this batch?
- Which products share an upstream dependency?
- How far has an incident propagated?
- What is the path between a quality event and a customer?

These are traversal problems.

A relational database can represent the same entities, but investigation queries require increasingly complex chains of joins and, for variable-depth dependencies, recursive queries.

In TRACE, the relationships are first-class:

```text
Batch
 → Production
 → Product
 → Shipment
 → Order
 → Customer
```

The graph therefore mirrors the real-world genealogy.

This makes variable-depth traversal, reverse traversal and dependency discovery natural operations.

---

# 14. Key Cypher Queries

## Query 1 — Multi-Hop Customer Impact

This is the primary traversal.

```cypher
MATCH path =
  (batch:IngredientBatch {id: $batchId})
  -[:USED_IN]->(:ProductionBatch)
  -[:PRODUCES]->(:Product)
  -[:CONTAINS_IN]->(:Shipment)
  -[:FULFILLS]->(:Order)
  -[:PLACED_BY]->(customer:Customer)

RETURN DISTINCT customer, path
```

This traverses five relationships:

```text
IngredientBatch
→ ProductionBatch
→ Product
→ Shipment
→ Order
→ Customer
```

---

# 15. Impact Summary

```cypher
MATCH (batch:IngredientBatch {id: $batchId})
MATCH (batch)-[:USED_IN]->(production:ProductionBatch)
MATCH (production)-[:PRODUCES]->(product:Product)
MATCH (product)-[:CONTAINS_IN]->(shipment:Shipment)
MATCH (shipment)-[:FULFILLS]->(order:Order)
MATCH (order)-[:PLACED_BY]->(customer:Customer)

RETURN
  count(DISTINCT production) AS productionBatches,
  count(DISTINCT product) AS products,
  count(DISTINCT shipment) AS shipments,
  count(DISTINCT order) AS orders,
  count(DISTINCT customer) AS customers
```

---

# 16. Graph-Specific Query

## Find Common Upstream Dependency

Question:

> "What upstream entity is shared by these products?"

```cypher
MATCH
  (p1:Product {id: $productA}),
  (p2:Product {id: $productB}),
  (p3:Product {id: $productC})

MATCH path1 = (common)-[*1..5]->(p1)
MATCH path2 = (common)-[*1..5]->(p2)
MATCH path3 = (common)-[*1..5]->(p3)

WHERE common:IngredientBatch
   OR common:Supplier
   OR common:ProductionBatch

RETURN DISTINCT
  common,
  path1,
  path2,
  path3
```

The important part is:

```text
[*1..5]
```

The system does not need to know beforehand whether the shared dependency is two, three, four or five relationships away.

This is a strong example of a graph traversal that would be awkward to model with conventional fixed joins.

---

# 17. Reverse Trace

Question:

> "Where did this product come from?"

```cypher
MATCH path =
  (product:Product {id: $productId})
  <-[:PRODUCES]-(production:ProductionBatch)
  <-[:USED_IN]-(batch:IngredientBatch)
  <-[:HAS_BATCH]-(ingredient:Ingredient)
  <-[:SUPPLIES]-(supplier:Supplier)

RETURN supplier, batch, production, path
```

---

# 18. Affected Products

```cypher
MATCH
  (event:QualityEvent {id: $eventId})
  -[:AFFECTS]->(batch:IngredientBatch)
  -[:USED_IN]->(:ProductionBatch)
  -[:PRODUCES]->(product:Product)

RETURN DISTINCT product
```

---

# 19. Parameterization

All Cypher queries must use parameters.

Correct:

```ts
session.run(
  `
  MATCH (b:IngredientBatch {id: $batchId})
  ...
  `,
  { batchId },
);
```

Never:

```ts
session.run(`MATCH (b:IngredientBatch {id: '${batchId}'})`);
```

No user input should be concatenated into Cypher.

---

# 20. System Architecture

```text
┌──────────────────────────────────────────┐
│                  USER                    │
│          Quality / Operations            │
└─────────────────────┬────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────┐
│              NEXT.JS APP                 │
│                                          │
│ Dashboard                                │
│ Investigation                            │
│ Graph Visualization                      │
│ Entity Details                            │
└─────────────────────┬────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────┐
│             APPLICATION LAYER            │
│                                          │
│ Investigation Service                    │
│ Impact Service                           │
│ Trace Service                            │
└─────────────────────┬────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────┐
│             GRAPH REPOSITORY             │
│                                          │
│ Parameterized Cypher                     │
│ Neo4j JavaScript Driver                  │
└─────────────────────┬────────────────────┘
                      │
                    Bolt
                      │
                      ▼
┌──────────────────────────────────────────┐
│                COGNODB                   │
│                                          │
│        Supply Chain Knowledge Graph      │
└──────────────────────────────────────────┘
```

---

# 21. Technology Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Graph Visualization

- React Flow

## Database

- CognoDB

## Database Driver

- Official Neo4j JavaScript driver

## Hosting

- Vercel

---

# 22. Project Structure

```text
trace/
│
├── app/
│   ├── page.tsx
│   │
│   ├── investigations/
│   │   └── [id]/
│   │       └── page.tsx
│   │
│   └── api/
│       ├── investigations/
│       ├── impact/
│       ├── trace/
│       └── products/
│
├── components/
│   ├── Dashboard.tsx
│   ├── InvestigationCard.tsx
│   ├── InvestigationHeader.tsx
│   ├── ImpactSummary.tsx
│   ├── SupplyChainGraph.tsx
│   ├── NodeDetails.tsx
│   ├── TracePath.tsx
│   ├── LoadingState.tsx
│   ├── EmptyState.tsx
│   └── ErrorState.tsx
│
├── lib/
│   ├── db.ts
│   ├── queries.ts
│   ├── graph.ts
│   ├── types.ts
│   └── errors.ts
│
├── scripts/
│   └── seed.ts
│
├── cypher/
│   ├── schema.cypher
│   └── queries.cypher
│
├── public/
│   └── screenshots/
│
├── .env.example
├── .gitignore
├── README.md
├── package.json
└── tsconfig.json
```

---

# 23. Database Configuration

Environment variables:

```env
COGNODB_URI=bolt+s://<instance-id>.databases.cognodb.cloud
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=<secret>
```

`.env` must never be committed.

`.env.example` should contain placeholders only.

---

# 24. Database Layer

`lib/db.ts`

Responsibilities:

- initialize Neo4j driver;
- connect to CognoDB;
- verify connectivity;
- expose query/session helpers;
- handle connection errors;
- avoid leaking credentials.

UI components must never directly connect to CognoDB.

---

# 25. Service Layer

## Investigation Service

Responsible for:

- quality events;
- investigation metadata;
- investigation details.

## Impact Service

Responsible for:

- downstream traversal;
- affected products;
- shipments;
- orders;
- customers;
- impact aggregation.

## Trace Service

Responsible for:

- forward trace;
- reverse trace;
- common dependency analysis.

---

# 26. Seed Data

The seed script should create realistic demo data.

Suggested size:

```text
Suppliers              5
Ingredients            15
Ingredient Batches     30
Production Batches     40
Products               20
Warehouses             5
Shipments              50
Orders                 100
Customers              60
Quality Events         5
```

The data should be intentionally connected rather than random.

---

# 27. Primary Demo Scenario

The seed script should guarantee one compelling investigation.

```text
Quality Event
QE-001

Type
Contamination

Severity
Critical

Affected Batch
RM-2047
```

RM-2047 should connect to several production batches.

Those production batches should create several products.

Those products should appear across multiple shipments and orders.

This ensures that the hosted demo always has a meaningful graph to explore.

---

# 28. UI Information Architecture

```text
TRACE
│
├── Overview
│
├── Investigations
│   └── Investigation Detail
│
└── Entity Detail
```

Keep navigation intentionally small.

The application is an investigation tool, not an enterprise ERP.

---

# 29. Dashboard

The dashboard should contain:

### Active Investigation

```text
RM-2047

CRITICAL

Contamination

7 products
27 shipments
142 orders

[ Investigate ]
```

### Recent Investigations

```text
ID       Batch       Severity     Status
QE-001   RM-2047     Critical     Open
QE-002   RM-1982     Medium       Open
QE-003   RM-1871     Low          Resolved
```

---

# 30. Investigation Page

```text
← Back to Investigations

CONTAMINATION
RM-2047

CRITICAL
UNDER INVESTIGATION

────────────────────────────────

IMPACT

4
Production Batches

7
Products

27
Shipments

142
Orders

118
Customers

────────────────────────────────

SUPPLY CHAIN GRAPH
```

---

# 31. Graph Interaction

Nodes should be:

- clickable;
- visually distinguishable by entity type;
- labeled clearly;
- connected with relationship labels where useful.

Clicking a node opens its detail panel.

Example:

```text
PRODUCT

P-102

Industrial Controller

SKU
CTRL-102

Production Batch
PB-331

Status
Recall Review

[ Trace Upstream ]
```

---

# 32. Loading States

Example:

```text
Tracing impact...

✓ Finding production batches
✓ Finding products
◌ Finding shipments
◌ Calculating customer impact
```

Avoid generic blank spinners where possible.

---

# 33. Empty States

Example:

```text
No downstream impact found.

This batch is not connected to any
production records in the current dataset.
```

---

# 34. Error States

If CognoDB is unavailable:

```text
Unable to connect to TRACE.

The graph database is currently unavailable.

Your data has not been modified.

[ Retry ]
```

Never expose:

- database credentials;
- connection URI;
- stack traces;
- internal server details.

---

# 35. Performance

CognoDB's free instance is intentionally small.

Therefore:

- keep seed data compact;
- use bounded graph traversal;
- avoid unbounded `[*]`;
- return only required properties;
- use `DISTINCT` when appropriate;
- aggregate counts in the database;
- limit graph visualization payloads.

Avoid:

```cypher
MATCH p=(b)-[*]-(x)
RETURN p
```

Prefer:

```cypher
MATCH p=(b)-[*1..6]-(x)
RETURN p
LIMIT 500
```

---

# 36. Testing

## Database

Test:

- valid connection;
- invalid connection;
- database unavailable state.

## Seed

Test:

- expected node counts;
- primary quality event exists;
- RM-2047 has downstream relationships.

## Cypher

Test:

- downstream impact;
- reverse trace;
- affected products;
- customer impact;
- common upstream dependency.

## UI

Test:

- dashboard;
- investigation page;
- graph rendering;
- node selection;
- loading state;
- empty state;
- error state.

---

# 37. README Requirements

The final README must contain:

1. Product overview
2. Problem statement
3. Why a graph database?
4. Graph data model
5. Architecture diagram
6. Setup instructions
7. CognoDB creation instructions
8. Environment variables
9. Seed instructions
10. Main Cypher queries
11. Screenshots
12. Hosted demo link
13. Screen recording link
14. Project limitations
15. Future improvements

---

# 38. Setup Instructions

## 1. Clone

```bash
git clone <repository-url>
cd trace
```

## 2. Install

```bash
npm install
```

## 3. Create CognoDB

Create a free CognoDB instance.

Copy:

```text
bolt+s://<instance-id>.databases.cognodb.cloud
```

and the generated password.

## 4. Configure environment

Create:

```text
.env.local
```

```env
COGNODB_URI=bolt+s://...
COGNODB_USERNAME=cognodb
COGNODB_PASSWORD=...
```

## 5. Seed database

```bash
npm run seed
```

## 6. Start application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

# 39. Deployment

Target architecture:

```text
GitHub
   ↓
Vercel
   ↓
Next.js
   ↓
CognoDB Cloud
```

Environment variables are configured through Vercel.

The CognoDB instance remains running after submission.

---

# 40. Demo Recording

Target length:

**2–3 minutes**

### 0:00–0:20 — Problem

> "I built TRACE, a product recall investigation tool. When a manufacturer discovers a defective batch, the difficult question is understanding everything that batch could affect."

### 0:20–0:50 — Investigation

Select:

`RM-2047`

Show:

```text
4 Production Batches
7 Products
27 Shipments
142 Orders
```

### 0:50–1:30 — Graph

Show the graph traversal.

Explain:

> "The supply chain is represented as a graph, allowing TRACE to follow the affected batch through production, products, shipments and orders."

### 1:30–2:00 — Reverse Trace

Select a product.

Show:

```text
Product
→ Production Batch
→ Ingredient Batch
→ Supplier
```

### 2:00–2:30 — Technical

Show:

- parameterized Cypher;
- seed script;
- graph model;
- application architecture.

### Closing

> "The graph is useful here because the core problem is not storing records. It is understanding the relationships and paths between them."

---

# 41. 48-Hour Build Plan

## Hours 0–3

- Create CognoDB instance
- Create GitHub repository
- Initialize Next.js
- Configure environment
- Verify database connection

## Hours 3–7

- Implement graph model
- Write schema
- Write seed script
- Load data
- Test Cypher

## Hours 7–14

- Implement database layer
- Implement repository functions
- Implement investigation APIs
- Implement impact queries

## Hours 14–22

- Build dashboard
- Build investigation page
- Build graph visualization
- Build node details
- Build upstream trace

## Hours 22–28

- Loading states
- Empty states
- Error states
- Responsive design
- UX polish

## Hours 28–34

- Test graph queries
- Test seed
- Test database failures
- Fix production issues

## Hours 34–40

- Deploy to Vercel
- Configure production environment
- Verify CognoDB connection

## Hours 40–44

- Write README
- Add architecture diagram
- Add screenshots
- Explain queries

## Hours 44–48

- Record demo
- Final QA
- Clean repository
- Submit

---

# 42. Success Criteria

The project is successful if a reviewer can:

1. Open the hosted application.
2. Understand the product within 30 seconds.
3. Select a quality event.
4. See the affected supply-chain entities.
5. Explore the graph.
6. Trace an affected product upstream.
7. See a multi-hop traversal.
8. Understand why graph technology is appropriate.
9. Inspect maintainable source code.
10. Run the project locally using the README.

---

# 43. Product Thesis

TRACE is not an ERP.

It is not inventory software.

It is not a warehouse management system.

It is an **investigation tool**.

Its central question is:

> **"Something went wrong. Where did it come from, and what did it affect?"**

A relational database can store every individual record.

TRACE uses a graph because the answer lives in the **relationships between those records**.

That relationship-first design is the core technical thesis of the project.

````

### One change I'd make before we actually build it

I would **not blindly use the exact relationship names in this draft**. Before coding, we should lock the graph model down to the smallest, cleanest set of relationships and make sure every one corresponds to an actual business event.

In particular, I'd model the core genealogy as:

```text
Supplier
   ↓ SUPPLIES
Material
   ↓ HAS_BATCH
MaterialBatch
   ↓ USED_IN
ProductionBatch
   ↓ PRODUCES
Product
   ↓ SHIPPED_IN
Shipment
   ↓ FULFILLS
Order
   ↓ PLACED_BY
Customer
````

Then make **QualityEvent → AFFECTS → MaterialBatch** the investigation entry point.

That gives us a very clean graph to defend in the Wexa interview.
