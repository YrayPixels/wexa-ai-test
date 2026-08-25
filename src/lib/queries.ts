export const LIST_INVESTIGATIONS = `
MATCH (event:QualityEvent)-[:AFFECTS]->(batch:MaterialBatch)
RETURN event {
  .id, .type, .description, .severity, .reportedAt, .status
} AS event,
batch.id AS batchId,
batch.batchNumber AS batchNumber
ORDER BY
  CASE event.severity
    WHEN 'Critical' THEN 0
    WHEN 'Medium' THEN 1
    ELSE 2
  END,
  event.reportedAt DESC
`;

export const GET_INVESTIGATION = `
MATCH (event:QualityEvent {id: $eventId})-[:AFFECTS]->(batch:MaterialBatch)
RETURN event {
  .id, .type, .description, .severity, .reportedAt, .status
} AS event,
batch.id AS batchId,
batch.batchNumber AS batchNumber
`;

export const IMPACT_SUMMARY = `
MATCH (event:QualityEvent {id: $eventId})-[:AFFECTS]->(batch:MaterialBatch)
OPTIONAL MATCH (batch)-[:USED_IN]->(production:ProductionBatch)
OPTIONAL MATCH (production)-[:PRODUCES]->(product:Product)
OPTIONAL MATCH (product)-[:SHIPPED_IN]->(shipment:Shipment)
OPTIONAL MATCH (shipment)-[:FULFILLS]->(order:Order)
OPTIONAL MATCH (order)-[:PLACED_BY]->(customer:Customer)
RETURN
  count(DISTINCT production) AS productionBatches,
  count(DISTINCT product) AS products,
  count(DISTINCT shipment) AS shipments,
  count(DISTINCT order) AS orders,
  count(DISTINCT customer) AS customers
`;

export const IMPACT_GRAPH = `
MATCH (event:QualityEvent {id: $eventId})-[:AFFECTS]->(batch:MaterialBatch)
OPTIONAL MATCH path =
  (batch)-[:USED_IN]->(:ProductionBatch)
  -[:PRODUCES]->(:Product)
  -[:SHIPPED_IN]->(:Shipment)
  -[:FULFILLS]->(:Order)
  -[:PLACED_BY]->(:Customer)
WITH event, batch, collect(path)[0..80] AS paths
RETURN event, batch, paths
`;

export const REVERSE_TRACE = `
MATCH (product:Product {id: $productId})
OPTIONAL MATCH path =
  (product)
  <-[:PRODUCES]-(:ProductionBatch)
  <-[:USED_IN]-(:MaterialBatch)
  <-[:HAS_BATCH]-(:Material)
  <-[:SUPPLIES]-(:Supplier)
RETURN product, path
LIMIT 1
`;

export const ENTITY_BY_ID = `
MATCH (n {id: $id})
WHERE n:Supplier OR n:Material OR n:MaterialBatch OR n:ProductionBatch
   OR n:Product OR n:Shipment OR n:Order OR n:Customer OR n:QualityEvent
RETURN n, labels(n) AS labels
LIMIT 1
`;

export const COMMON_UPSTREAM = `
UNWIND $productIds AS productId
MATCH (p:Product {id: productId})
MATCH (common)-[*1..5]->(p)
WHERE common:MaterialBatch OR common:Supplier OR common:ProductionBatch OR common:Material
WITH common, count(DISTINCT p) AS sharedBy
WHERE sharedBy = size($productIds)
RETURN common, labels(common) AS labels, sharedBy
ORDER BY
  CASE
    WHEN 'MaterialBatch' IN labels(common) THEN 0
    WHEN 'ProductionBatch' IN labels(common) THEN 1
    WHEN 'Material' IN labels(common) THEN 2
    ELSE 3
  END
LIMIT 10
`;
