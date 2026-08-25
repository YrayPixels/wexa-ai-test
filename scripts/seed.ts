/**
 * TRACE seed script — loads a connected supply-chain graph into CognoDB.
 *
 * Primary demo path:
 *   QE-001 (Contamination) → RM-2047 → production → products → shipments → orders → customers
 *
 * Run: npm run seed
 */
import "dotenv/config";
import { config as loadEnv } from "dotenv";
import neo4j, { type Driver, type Session } from "neo4j-driver";

loadEnv({ path: ".env.local" });
loadEnv();

const uri = process.env.COGNODB_URI;
const username = process.env.COGNODB_USERNAME ?? "cognodb";
const password = process.env.COGNODB_PASSWORD;

if (!uri || !password) {
  console.error(
    "Missing COGNODB_URI or COGNODB_PASSWORD. Copy .env.example → .env.local first.",
  );
  process.exit(1);
}

const driver: Driver = neo4j.driver(uri, neo4j.auth.basic(username, password));

async function clear(session: Session) {
  await session.run("MATCH (n) DETACH DELETE n");
}

async function seed(session: Session) {
  // --- Suppliers & materials ---
  await session.run(`
    UNWIND $suppliers AS s
    CREATE (:Supplier {id: s.id, name: s.name, location: s.location})
  `, {
    suppliers: [
      { id: "SUP-01", name: "Apex Components", location: "Detroit, MI" },
      { id: "SUP-02", name: "Nordic Polymers", location: "Gothenburg, SE" },
      { id: "SUP-03", name: "Pacific Alloys", location: "Busan, KR" },
      { id: "SUP-04", name: "Helix Electronics", location: "Austin, TX" },
      { id: "SUP-05", name: "Cascade Sealants", location: "Portland, OR" },
    ],
  });

  await session.run(`
    UNWIND $materials AS m
    MATCH (s:Supplier {id: m.supplierId})
    CREATE (mat:Material {id: m.id, name: m.name, category: m.category})
    CREATE (s)-[:SUPPLIES]->(mat)
  `, {
    materials: [
      { id: "MAT-01", name: "Industrial Motor Housing", category: "Casting", supplierId: "SUP-01" },
      { id: "MAT-02", name: "Polymer Seal Ring", category: "Polymer", supplierId: "SUP-02" },
      { id: "MAT-03", name: "Stainless Fastener Kit", category: "Hardware", supplierId: "SUP-03" },
      { id: "MAT-04", name: "Control Board PCB", category: "Electronics", supplierId: "SUP-04" },
      { id: "MAT-05", name: "Thermal Compound", category: "Chemical", supplierId: "SUP-05" },
      { id: "MAT-06", name: "Aluminum Frame Extrusion", category: "Metal", supplierId: "SUP-01" },
      { id: "MAT-07", name: "Sensor Module", category: "Electronics", supplierId: "SUP-04" },
      { id: "MAT-08", name: "Gasket Compound", category: "Chemical", supplierId: "SUP-05" },
    ],
  });

  // Material batches — RM-2047 is the contaminated hero batch
  const materialBatches = [
    { id: "MB-RM-2047", batchNumber: "RM-2047", materialId: "MAT-01", manufactureDate: "2026-06-12", expiryDate: "2028-06-12", status: "Quarantine" },
    { id: "MB-RM-1982", batchNumber: "RM-1982", materialId: "MAT-02", manufactureDate: "2026-05-01", expiryDate: "2027-05-01", status: "Active" },
    { id: "MB-RM-1871", batchNumber: "RM-1871", materialId: "MAT-05", manufactureDate: "2026-04-18", expiryDate: "2027-04-18", status: "Closed" },
    { id: "MB-RM-2101", batchNumber: "RM-2101", materialId: "MAT-03", manufactureDate: "2026-07-02", expiryDate: "2029-07-02", status: "Active" },
    { id: "MB-RM-2110", batchNumber: "RM-2110", materialId: "MAT-04", manufactureDate: "2026-07-10", expiryDate: "2028-07-10", status: "Active" },
    { id: "MB-RM-2122", batchNumber: "RM-2122", materialId: "MAT-06", manufactureDate: "2026-07-15", expiryDate: "2029-07-15", status: "Active" },
    { id: "MB-RM-2130", batchNumber: "RM-2130", materialId: "MAT-07", manufactureDate: "2026-07-20", expiryDate: "2028-07-20", status: "Active" },
    { id: "MB-RM-2144", batchNumber: "RM-2144", materialId: "MAT-08", manufactureDate: "2026-07-22", expiryDate: "2027-07-22", status: "Active" },
    { id: "MB-RM-1900", batchNumber: "RM-1900", materialId: "MAT-01", manufactureDate: "2026-03-01", expiryDate: "2028-03-01", status: "Closed" },
    { id: "MB-RM-1955", batchNumber: "RM-1955", materialId: "MAT-02", manufactureDate: "2026-04-01", expiryDate: "2027-04-01", status: "Active" },
  ];

  await session.run(`
    UNWIND $batches AS b
    MATCH (m:Material {id: b.materialId})
    CREATE (mb:MaterialBatch {
      id: b.id,
      batchNumber: b.batchNumber,
      manufactureDate: b.manufactureDate,
      expiryDate: b.expiryDate,
      status: b.status
    })
    CREATE (m)-[:HAS_BATCH]->(mb)
  `, { batches: materialBatches });

  // Production batches fed by RM-2047 (4) + others
  const productionBatches = [
    { id: "PB-331", batchNumber: "PB-331", productionDate: "2026-08-02", facility: "Plant A", materialBatchId: "MB-RM-2047" },
    { id: "PB-334", batchNumber: "PB-334", productionDate: "2026-08-05", facility: "Plant A", materialBatchId: "MB-RM-2047" },
    { id: "PB-341", batchNumber: "PB-341", productionDate: "2026-08-09", facility: "Plant B", materialBatchId: "MB-RM-2047" },
    { id: "PB-348", batchNumber: "PB-348", productionDate: "2026-08-12", facility: "Plant B", materialBatchId: "MB-RM-2047" },
    { id: "PB-220", batchNumber: "PB-220", productionDate: "2026-07-01", facility: "Plant A", materialBatchId: "MB-RM-1982" },
    { id: "PB-225", batchNumber: "PB-225", productionDate: "2026-07-08", facility: "Plant A", materialBatchId: "MB-RM-1982" },
    { id: "PB-180", batchNumber: "PB-180", productionDate: "2026-06-15", facility: "Plant C", materialBatchId: "MB-RM-1871" },
    { id: "PB-400", batchNumber: "PB-400", productionDate: "2026-08-18", facility: "Plant A", materialBatchId: "MB-RM-2101" },
    { id: "PB-405", batchNumber: "PB-405", productionDate: "2026-08-19", facility: "Plant B", materialBatchId: "MB-RM-2110" },
    { id: "PB-410", batchNumber: "PB-410", productionDate: "2026-08-20", facility: "Plant A", materialBatchId: "MB-RM-2122" },
  ];

  await session.run(`
    UNWIND $batches AS b
    MATCH (mb:MaterialBatch {id: b.materialBatchId})
    CREATE (pb:ProductionBatch {
      id: b.id,
      batchNumber: b.batchNumber,
      productionDate: b.productionDate,
      facility: b.facility
    })
    CREATE (mb)-[:USED_IN]->(pb)
  `, { batches: productionBatches });

  // Products — 7 tied to RM-2047 production batches
  const products = [
    { id: "P-102", sku: "CTRL-102", name: "Industrial Controller", category: "Controls", productionBatchId: "PB-331" },
    { id: "P-103", sku: "CTRL-103", name: "Industrial Controller XL", category: "Controls", productionBatchId: "PB-331" },
    { id: "P-210", sku: "DRV-210", name: "Drive Assembly", category: "Motion", productionBatchId: "PB-334" },
    { id: "P-211", sku: "DRV-211", name: "Drive Assembly Compact", category: "Motion", productionBatchId: "PB-334" },
    { id: "P-305", sku: "SNS-305", name: "Line Sensor Hub", category: "Sensing", productionBatchId: "PB-341" },
    { id: "P-306", sku: "SNS-306", name: "Line Sensor Hub Pro", category: "Sensing", productionBatchId: "PB-341" },
    { id: "P-410", sku: "PWR-410", name: "Power Module", category: "Power", productionBatchId: "PB-348" },
    // unrelated products for other investigations
    { id: "P-050", sku: "SEAL-050", name: "Seal Kit Standard", category: "Parts", productionBatchId: "PB-220" },
    { id: "P-051", sku: "SEAL-051", name: "Seal Kit Heavy", category: "Parts", productionBatchId: "PB-225" },
    { id: "P-020", sku: "THM-020", name: "Thermal Pack", category: "Chemical", productionBatchId: "PB-180" },
    { id: "P-500", sku: "FRM-500", name: "Frame Kit", category: "Metal", productionBatchId: "PB-410" },
    { id: "P-520", sku: "PCB-520", name: "Logic Board", category: "Electronics", productionBatchId: "PB-405" },
  ];

  await session.run(`
    UNWIND $products AS p
    MATCH (pb:ProductionBatch {id: p.productionBatchId})
    CREATE (product:Product {
      id: p.id,
      sku: p.sku,
      name: p.name,
      category: p.category
    })
    CREATE (pb)-[:PRODUCES]->(product)
  `, { products });

  // Customers
  const customers = Array.from({ length: 28 }, (_, i) => ({
    id: `CUS-${String(i + 1).padStart(3, "0")}`,
    name: [
      "Northline Manufacturing",
      "Blue Harbor Foods",
      "Summit Robotics",
      "Harborview Logistics",
      "Cedar Peak Industrial",
      "Atlas Fabrication",
      "Riverbend Automation",
      "Oak & Steel Works",
      "Polaris Packaging",
      "Ironclad Systems",
      "Lumen Medical Devices",
      "Brightfield Energy",
      "Cascade Tooling",
      "Silverline Electronics",
      "Granite State Motors",
      "Pacific Rim Assembly",
      "Midwest Conveyor Co",
      "Evergreen Pharma",
      "Redwood Precision",
      "Horizon Aerospace",
      "Keystone Utilities",
      "Valley Forge Parts",
      "Copperhead Mining",
      "Skyline Transit",
      "Anchor Marine",
      "Pioneer Agriculture",
      "Delta Cooling",
      "Meridian Optics",
    ][i],
    region: ["Midwest", "Northeast", "West", "South", "EU", "APAC"][i % 6],
  }));

  await session.run(`
    UNWIND $customers AS c
    CREATE (:Customer {id: c.id, name: c.name, region: c.region})
  `, { customers });

  // Orders + shipments for RM-2047 products
  // Target hero impact: 4 PB, 7 products, 18 shipments, 24 orders, 22 customers
  const affectedProductIds = [
    "P-102", "P-103", "P-210", "P-211", "P-305", "P-306", "P-410",
  ];

  const shipments: Array<{
    id: string;
    shippedAt: string;
    quantity: number;
    status: string;
    productId: string;
    orderId: string;
    customerId: string;
    orderNumber: string;
    orderDate: string;
    orderStatus: string;
  }> = [];

  let shipIdx = 1;
  let orderIdx = 1;
  affectedProductIds.forEach((productId, pIndex) => {
    const shipmentCount = pIndex < 4 ? 3 : 2; // 4*3 + 3*2 = 18
    for (let s = 0; s < shipmentCount; s++) {
      const customerId = customers[(shipIdx + pIndex) % customers.length].id;
      const orderId = `ORD-${String(orderIdx).padStart(3, "0")}`;
      const shipmentId = `SHP-${String(shipIdx).padStart(3, "0")}`;
      shipments.push({
        id: shipmentId,
        shippedAt: `2026-08-${String(10 + (shipIdx % 14)).padStart(2, "0")}`,
        quantity: 10 + (shipIdx % 20),
        status: shipIdx % 5 === 0 ? "In Transit" : "Delivered",
        productId,
        orderId,
        customerId,
        orderNumber: `SO-2026-${String(orderIdx).padStart(4, "0")}`,
        orderDate: `2026-08-${String(1 + (orderIdx % 20)).padStart(2, "0")}`,
        orderStatus: "Fulfilled",
      });
      shipIdx += 1;
      orderIdx += 1;
    }
  });

  // Extra orders sharing some customers already linked (boost distinct order count)
  for (let i = 0; i < 6; i++) {
    const productId = affectedProductIds[i % affectedProductIds.length];
    const customerId = customers[(i + 3) % 22].id;
    const orderId = `ORD-${String(orderIdx).padStart(3, "0")}`;
    const shipmentId = `SHP-${String(shipIdx).padStart(3, "0")}`;
    shipments.push({
      id: shipmentId,
      shippedAt: `2026-08-${String(12 + i).padStart(2, "0")}`,
      quantity: 5 + i,
      status: "Delivered",
      productId,
      orderId,
      customerId,
      orderNumber: `SO-2026-${String(orderIdx).padStart(4, "0")}`,
      orderDate: `2026-08-${String(5 + i).padStart(2, "0")}`,
      orderStatus: "Fulfilled",
    });
    shipIdx += 1;
    orderIdx += 1;
  }

  // Unrelated shipments for other products (dashboard noise / other events)
  for (let i = 0; i < 12; i++) {
    const productId = ["P-050", "P-051", "P-020", "P-500", "P-520"][i % 5];
    const customerId = customers[(i + 10) % customers.length].id;
    const orderId = `ORD-${String(orderIdx).padStart(3, "0")}`;
    const shipmentId = `SHP-${String(shipIdx).padStart(3, "0")}`;
    shipments.push({
      id: shipmentId,
      shippedAt: `2026-07-${String(5 + i).padStart(2, "0")}`,
      quantity: 8 + i,
      status: "Delivered",
      productId,
      orderId,
      customerId,
      orderNumber: `SO-2026-${String(orderIdx).padStart(4, "0")}`,
      orderDate: `2026-07-${String(1 + i).padStart(2, "0")}`,
      orderStatus: "Fulfilled",
    });
    shipIdx += 1;
    orderIdx += 1;
  }

  await session.run(`
    UNWIND $shipments AS s
    MATCH (product:Product {id: s.productId})
    MATCH (customer:Customer {id: s.customerId})
    CREATE (shipment:Shipment {
      id: s.id,
      shippedAt: s.shippedAt,
      quantity: s.quantity,
      status: s.status
    })
    CREATE (order:Order {
      id: s.orderId,
      orderNumber: s.orderNumber,
      orderDate: s.orderDate,
      status: s.orderStatus
    })
    CREATE (product)-[:SHIPPED_IN]->(shipment)
    CREATE (shipment)-[:FULFILLS]->(order)
    CREATE (order)-[:PLACED_BY]->(customer)
  `, { shipments });

  // Quality events
  await session.run(`
    UNWIND $events AS e
    MATCH (batch:MaterialBatch {batchNumber: e.batchNumber})
    CREATE (event:QualityEvent {
      id: e.id,
      type: e.type,
      description: e.description,
      severity: e.severity,
      reportedAt: e.reportedAt,
      status: e.status
    })
    CREATE (event)-[:AFFECTS]->(batch)
  `, {
    events: [
      {
        id: "QE-001",
        type: "Contamination",
        description: "Suspected metallic particulate contamination in motor housing castings.",
        severity: "Critical",
        reportedAt: "2026-08-20",
        status: "Under Investigation",
        batchNumber: "RM-2047",
      },
      {
        id: "QE-002",
        type: "Dimensional Drift",
        description: "Seal ring diameter outside tolerance on sampled units.",
        severity: "Medium",
        reportedAt: "2026-08-14",
        status: "Open",
        batchNumber: "RM-1982",
      },
      {
        id: "QE-003",
        type: "Expiry Near Miss",
        description: "Thermal compound approaching expiry before consumption.",
        severity: "Low",
        reportedAt: "2026-07-28",
        status: "Resolved",
        batchNumber: "RM-1871",
      },
    ],
  });

  // Constraints / indexes for demo performance
  const constraints = [
    "CREATE CONSTRAINT supplier_id IF NOT EXISTS FOR (n:Supplier) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT material_id IF NOT EXISTS FOR (n:Material) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT material_batch_id IF NOT EXISTS FOR (n:MaterialBatch) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT production_batch_id IF NOT EXISTS FOR (n:ProductionBatch) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT product_id IF NOT EXISTS FOR (n:Product) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT shipment_id IF NOT EXISTS FOR (n:Shipment) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT order_id IF NOT EXISTS FOR (n:Order) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT customer_id IF NOT EXISTS FOR (n:Customer) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT quality_event_id IF NOT EXISTS FOR (n:QualityEvent) REQUIRE n.id IS UNIQUE",
  ];

  for (const cypher of constraints) {
    try {
      await session.run(cypher);
    } catch (error) {
      // Free-tier / older engines may not support all constraint syntax — non-fatal
      console.warn(`Constraint skipped: ${(error as Error).message}`);
    }
  }
}

async function summarize(session: Session) {
  const counts = await session.run(`
    MATCH (n)
    RETURN labels(n)[0] AS label, count(*) AS count
    ORDER BY count DESC
  `);
  console.log("\nNode counts:");
  for (const record of counts.records) {
    console.log(`  ${record.get("label")}: ${record.get("count")}`);
  }

  const impact = await session.run(`
    MATCH (event:QualityEvent {id: 'QE-001'})-[:AFFECTS]->(batch:MaterialBatch)
    MATCH (batch)-[:USED_IN]->(production:ProductionBatch)
    MATCH (production)-[:PRODUCES]->(product:Product)
    MATCH (product)-[:SHIPPED_IN]->(shipment:Shipment)
    MATCH (shipment)-[:FULFILLS]->(order:Order)
    MATCH (order)-[:PLACED_BY]->(customer:Customer)
    RETURN
      batch.batchNumber AS batch,
      count(DISTINCT production) AS productionBatches,
      count(DISTINCT product) AS products,
      count(DISTINCT shipment) AS shipments,
      count(DISTINCT order) AS orders,
      count(DISTINCT customer) AS customers
  `);

  const row = impact.records[0];
  console.log("\nHero investigation QE-001 / RM-2047:");
  console.log(`  Production batches: ${row.get("productionBatches")}`);
  console.log(`  Products: ${row.get("products")}`);
  console.log(`  Shipments: ${row.get("shipments")}`);
  console.log(`  Orders: ${row.get("orders")}`);
  console.log(`  Customers: ${row.get("customers")}`);
}

async function main() {
  console.log("Connecting to CognoDB…");
  await driver.verifyConnectivity();
  const session = driver.session();
  try {
    console.log("Clearing existing graph…");
    await clear(session);
    console.log("Seeding TRACE supply chain…");
    await seed(session);
    await summarize(session);
    console.log("\nSeed complete.");
  } finally {
    await session.close();
    await driver.close();
  }
}

main().catch(async (error) => {
  console.error("Seed failed:", error);
  await driver.close();
  process.exit(1);
});
