import type { ZodError } from "zod";
import { CanvasEventSchema } from "./canvas-events";
import { TraceEventSchema } from "./trace-events";

export function parseCanvasEventJson(value: unknown) {
  return CanvasEventSchema.safeParse(value);
}

export function parseTraceEventJson(value: unknown) {
  return TraceEventSchema.safeParse(value);
}

export function formatZodError(err: ZodError): string {
  return err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
}
