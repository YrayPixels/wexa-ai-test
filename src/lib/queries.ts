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

export const LIST_BATCHES = `
MATCH (material:Material)-[:HAS_BATCH]->(batch:MaterialBatch)
OPTIONAL MATCH (supplier:Supplier)-[:SUPPLIES]->(material)
OPTIONAL MATCH (event:QualityEvent)-[:AFFECTS]->(batch)
RETURN batch {
  .id, .batchNumber, .manufactureDate, .expiryDate, .status
} AS batch,
material.name AS materialName,
supplier.name AS supplierName,
event {
  .id, .type, .severity, .status
} AS event
ORDER BY
  CASE WHEN event IS NULL THEN 1 ELSE 0 END,
  CASE event.severity
    WHEN 'Critical' THEN 0
    WHEN 'Medium' THEN 1
    ELSE 2
  END,
  batch.batchNumber
`;

export const LIST_PRODUCTS = `
MATCH (product:Product)
OPTIONAL MATCH (production:ProductionBatch)-[:PRODUCES]->(product)
OPTIONAL MATCH (batch:MaterialBatch)-[:USED_IN]->(production)
OPTIONAL MATCH (event:QualityEvent)-[:AFFECTS]->(batch)
RETURN product {
  .id, .sku, .name, .category
} AS product,
production.batchNumber AS productionBatch,
batch.batchNumber AS materialBatch,
collect(DISTINCT event { .id, .type, .severity }) AS events
ORDER BY
  CASE WHEN size([e IN events WHERE e IS NOT NULL]) > 0 THEN 0 ELSE 1 END,
  product.sku
`;

export const LIST_SHIPMENTS = `
MATCH (shipment:Shipment)
OPTIONAL MATCH (product:Product)-[:SHIPPED_IN]->(shipment)
OPTIONAL MATCH (shipment)-[:FULFILLS]->(order:Order)
OPTIONAL MATCH (order)-[:PLACED_BY]->(customer:Customer)
OPTIONAL MATCH (production:ProductionBatch)-[:PRODUCES]->(product)
OPTIONAL MATCH (batch:MaterialBatch)-[:USED_IN]->(production)
OPTIONAL MATCH (event:QualityEvent)-[:AFFECTS]->(batch)
RETURN shipment {
  .id, .shippedAt, .quantity, .status
} AS shipment,
product.sku AS productSku,
product.name AS productName,
order.orderNumber AS orderNumber,
customer.name AS customerName,
collect(DISTINCT event { .id, .type, .severity }) AS events
ORDER BY
  CASE WHEN size([e IN events WHERE e IS NOT NULL]) > 0 THEN 0 ELSE 1 END,
  shipment.shippedAt DESC,
  shipment.id
`;

export const LIST_CUSTOMERS = `
MATCH (customer:Customer)
OPTIONAL MATCH (order:Order)-[:PLACED_BY]->(customer)
OPTIONAL MATCH (shipment:Shipment)-[:FULFILLS]->(order)
OPTIONAL MATCH (product:Product)-[:SHIPPED_IN]->(shipment)
OPTIONAL MATCH (production:ProductionBatch)-[:PRODUCES]->(product)
OPTIONAL MATCH (batch:MaterialBatch)-[:USED_IN]->(production)
OPTIONAL MATCH (event:QualityEvent)-[:AFFECTS]->(batch)
WITH customer,
  count(DISTINCT order) AS orderCount,
  count(DISTINCT shipment) AS shipmentCount,
  collect(DISTINCT event { .id, .type, .severity }) AS events
RETURN customer {
  .id, .name, .region
} AS customer,
orderCount,
shipmentCount,
[e IN events WHERE e IS NOT NULL] AS events
ORDER BY
  CASE WHEN size(events) > 0 THEN 0 ELSE 1 END,
  customer.name
`;

export const EVENT_FOR_BATCH = `
MATCH (batch:MaterialBatch {id: $batchId})
OPTIONAL MATCH (event:QualityEvent)-[:AFFECTS]->(batch)
RETURN batch {
  .id, .batchNumber, .manufactureDate, .expiryDate, .status
} AS batch,
event.id AS eventId
`;

export const ENTITY_NEIGHBORHOOD = `
MATCH (n {id: $id})
WHERE n:Supplier OR n:Material OR n:MaterialBatch OR n:ProductionBatch
   OR n:Product OR n:Shipment OR n:Order OR n:Customer OR n:QualityEvent
OPTIONAL MATCH (n)-[r]-(m)
WHERE m:Supplier OR m:Material OR m:MaterialBatch OR m:ProductionBatch
   OR m:Product OR m:Shipment OR m:Order OR m:Customer OR m:QualityEvent
WITH n,
  collect(DISTINCT {
    type: type(r),
    direction: CASE WHEN startNode(r) = n THEN 'OUT' ELSE 'IN' END,
    neighbor: m
  })[0..50] AS connections
OPTIONAL MATCH path = (n)-[*1..5]-(related)
WHERE related:Supplier OR related:Material OR related:MaterialBatch
   OR related:ProductionBatch OR related:Product OR related:Shipment
   OR related:Order OR related:Customer OR related:QualityEvent
RETURN n,
  labels(n) AS labels,
  connections,
  collect(DISTINCT path)[0..35] AS paths
`;

export const EVENTS_FOR_ENTITY = `
MATCH (n {id: $id})
WHERE n:MaterialBatch OR n:Product OR n:Shipment OR n:Customer
   OR n:ProductionBatch OR n:Order OR n:QualityEvent
OPTIONAL MATCH (event:QualityEvent)-[:AFFECTS]->(n)
OPTIONAL MATCH (eventBatch:QualityEvent)-[:AFFECTS]->(n)
  WHERE n:MaterialBatch
OPTIONAL MATCH (eventProduct:QualityEvent)-[:AFFECTS]->(:MaterialBatch)
  -[:USED_IN]->(:ProductionBatch)-[:PRODUCES]->(n)
  WHERE n:Product
OPTIONAL MATCH (eventShipment:QualityEvent)-[:AFFECTS]->(:MaterialBatch)
  -[:USED_IN]->(:ProductionBatch)-[:PRODUCES]->(:Product)-[:SHIPPED_IN]->(n)
  WHERE n:Shipment
OPTIONAL MATCH (eventCustomer:QualityEvent)-[:AFFECTS]->(:MaterialBatch)
  -[:USED_IN]->(:ProductionBatch)-[:PRODUCES]->(:Product)
  -[:SHIPPED_IN]->(:Shipment)-[:FULFILLS]->(:Order)-[:PLACED_BY]->(n)
  WHERE n:Customer
OPTIONAL MATCH (eventSelf:QualityEvent)
  WHERE n:QualityEvent AND eventSelf = n
WITH [
  event, eventBatch, eventProduct, eventShipment, eventCustomer, eventSelf
] AS raw
UNWIND raw AS eventNode
WITH DISTINCT eventNode
WHERE eventNode IS NOT NULL
RETURN eventNode {
  .id, .type, .severity, .status, .description, .reportedAt
} AS event
`;
