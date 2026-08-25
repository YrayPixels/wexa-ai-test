import { propsOf, toNumber, withSession } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { graphFromPaths, nodeSubtitle, nodeTitle, pickLabel } from "@/lib/graph";
import {
  ENTITY_BY_ID,
  GET_INVESTIGATION,
  IMPACT_GRAPH,
  IMPACT_SUMMARY,
  LIST_INVESTIGATIONS,
  REVERSE_TRACE,
} from "@/lib/queries";
import type {
  EntityDetail,
  ImpactSummary,
  InvestigationDetail,
  QualityEvent,
  TraceStep,
} from "@/lib/types";

function mapEvent(
  event: Record<string, unknown>,
  batchId: string,
  batchNumber: string,
): QualityEvent {
  return {
    id: String(event.id),
    type: String(event.type),
    description: String(event.description ?? ""),
    severity: event.severity as QualityEvent["severity"],
    reportedAt: String(event.reportedAt),
    status: event.status as QualityEvent["status"],
    batchId,
    batchNumber,
  };
}

export async function listInvestigations(): Promise<QualityEvent[]> {
  return withSession(async (session) => {
    const result = await session.run(LIST_INVESTIGATIONS);
    return result.records.map((record) => {
      const event = propsOf(record.get("event"));
      return mapEvent(
        event,
        String(record.get("batchId")),
        String(record.get("batchNumber")),
      );
    });
  });
}

export async function getInvestigation(
  eventId: string,
): Promise<InvestigationDetail> {
  return withSession(async (session) => {
    const detail = await session.run(GET_INVESTIGATION, { eventId });
    if (detail.records.length === 0) {
      throw new AppError("Investigation not found.", 404, "NOT_FOUND");
    }

    const eventRecord = detail.records[0];
    const event = mapEvent(
      propsOf(eventRecord.get("event")),
      String(eventRecord.get("batchId")),
      String(eventRecord.get("batchNumber")),
    );

    const impactResult = await session.run(IMPACT_SUMMARY, { eventId });
    const graphResult = await session.run(IMPACT_GRAPH, { eventId });

    const impactRow = impactResult.records[0];
    const impact: ImpactSummary = {
      productionBatches: toNumber(impactRow?.get("productionBatches")),
      products: toNumber(impactRow?.get("products")),
      shipments: toNumber(impactRow?.get("shipments")),
      orders: toNumber(impactRow?.get("orders")),
      customers: toNumber(impactRow?.get("customers")),
    };

    const graphRow = graphResult.records[0];
    const eventNode = graphRow?.get("event");
    const batchNode = graphRow?.get("batch");
    const paths = (graphRow?.get("paths") as unknown[]) ?? [];

    const graph = graphFromPaths(
      paths as Parameters<typeof graphFromPaths>[0],
      [eventNode, batchNode].filter(Boolean),
    );

    // Ensure QualityEvent → MaterialBatch edge exists for visualization
    if (event.id && event.batchId) {
      const edgeId = `${event.id}-AFFECTS-${event.batchId}`;
      if (!graph.edges.some((e) => e.id === edgeId)) {
        graph.edges.unshift({
          id: edgeId,
          source: event.id,
          target: event.batchId,
          type: "AFFECTS",
        });
      }
      if (!graph.nodes.some((n) => n.id === event.id)) {
        graph.nodes.unshift({
          id: event.id,
          label: "QualityEvent",
          title: event.type,
          subtitle: event.severity,
          data: { ...event },
        });
      }
    }

    return { event, impact, graph };
  });
}

export async function reverseTrace(productId: string): Promise<TraceStep[]> {
  return withSession(async (session) => {
    const result = await session.run(REVERSE_TRACE, { productId });
    if (result.records.length === 0) {
      throw new AppError("Product not found.", 404, "NOT_FOUND");
    }

    const path = result.records[0].get("path") as
      | {
          segments?: Array<{
            start: { labels: string[]; properties: Record<string, unknown> };
            end: { labels: string[]; properties: Record<string, unknown> };
          }>;
        }
      | null;

    const product = result.records[0].get("product") as {
      labels: string[];
      properties: Record<string, unknown>;
    };

    const steps: TraceStep[] = [];
    const seen = new Set<string>();

    const pushNode = (node: {
      labels: string[];
      properties: Record<string, unknown>;
    }) => {
      const label = pickLabel(node.labels ?? []);
      const props = propsOf(node.properties);
      const id = String(props.id ?? "");
      if (!id || seen.has(id)) return;
      seen.add(id);
      steps.push({
        id,
        label,
        title: nodeTitle(label, props),
        subtitle: nodeSubtitle(label, props),
      });
    };

    pushNode(product);

    if (path?.segments) {
      // Walk upstream: each segment end→start is reverse of PRODUCES/USED_IN etc.
      // Path is already upstream direction from query (product <- ... <- supplier)
      for (const segment of path.segments) {
        pushNode(segment.end);
      }
    }

    return steps;
  });
}

export async function getEntity(id: string): Promise<EntityDetail> {
  return withSession(async (session) => {
    const result = await session.run(ENTITY_BY_ID, { id });
    if (result.records.length === 0) {
      throw new AppError("Entity not found.", 404, "NOT_FOUND");
    }
    const node = result.records[0].get("n") as {
      properties: Record<string, unknown>;
    };
    const labels = result.records[0].get("labels") as string[];
    const label = pickLabel(labels);
    const properties = propsOf(node.properties);
    return {
      id: String(properties.id ?? id),
      label,
      title: nodeTitle(label, properties),
      properties,
    };
  });
}
