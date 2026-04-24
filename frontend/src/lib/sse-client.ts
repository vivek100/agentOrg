import { parseCanvasEventJson, parseTraceEventJson, type CanvasEvent, type TraceEvent } from "@/lib/contracts";

function emitDataLines(block: string, onEvent: (event: CanvasEvent) => void) {
  for (const rawLine of block.split("\n")) {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) {
      continue;
    }
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") {
      continue;
    }
    let json: unknown;
    try {
      json = JSON.parse(payload);
    } catch {
      continue;
    }
    const parsed = parseCanvasEventJson(json);
    if (parsed.success) {
      onEvent(parsed.data);
    }
  }
}

/**
 * Reads an SSE response body and yields parsed canvas events (one JSON object per `data:` line).
 */
function emitTraceDataLines(block: string, onEvent: (event: TraceEvent) => void) {
  for (const rawLine of block.split("\n")) {
    const line = rawLine.trim();
    if (!line.startsWith("data:")) {
      continue;
    }
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") {
      continue;
    }
    let json: unknown;
    try {
      json = JSON.parse(payload);
    } catch {
      continue;
    }
    const parsed = parseTraceEventJson(json);
    if (parsed.success) {
      onEvent(parsed.data);
    }
  }
}

/**
 * Reads an SSE body and yields trace/run events.
 */
export async function consumeTraceSse(
  response: Response,
  onEvent: (event: TraceEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  if (!response.body) {
    throw new Error("Response has no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let carry = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      if (carry.trim()) {
        emitTraceDataLines(carry, onEvent);
      }
      break;
    }
    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    carry += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = carry.indexOf("\n\n")) >= 0) {
      const block = carry.slice(0, sep);
      carry = carry.slice(sep + 2);
      emitTraceDataLines(block, onEvent);
    }
  }
}

export async function consumeCanvasSse(
  response: Response,
  onEvent: (event: CanvasEvent) => void,
  signal: AbortSignal,
): Promise<void> {
  if (!response.body) {
    throw new Error("Response has no body");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let carry = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      if (carry.trim()) {
        emitDataLines(carry, onEvent);
      }
      break;
    }
    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    carry += decoder.decode(value, { stream: true });

    let sep: number;
    while ((sep = carry.indexOf("\n\n")) >= 0) {
      const block = carry.slice(0, sep);
      carry = carry.slice(sep + 2);
      emitDataLines(block, onEvent);
    }
  }
}
