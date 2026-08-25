// TRACE graph model (constraints + wipe live in scripts/seed.ts)
//
// Supplier -[:SUPPLIES]-> Material -[:HAS_BATCH]-> MaterialBatch
//   -[:USED_IN]-> ProductionBatch -[:PRODUCES]-> Product
//   -[:SHIPPED_IN]-> Shipment -[:FULFILLS]-> Order -[:PLACED_BY]-> Customer
//
// QualityEvent -[:AFFECTS]-> MaterialBatch
//
// Wipe all nodes before reseeding:
MATCH (n) DETACH DELETE n;
