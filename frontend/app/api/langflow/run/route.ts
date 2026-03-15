import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const LANGFLOW_BASE_URL = (
  process.env.LANGFLOW_BASE_URL || "http://127.0.0.1:7860"
).replace(/\/$/, "");

const LANGFLOW_FLOW_ID =
  process.env.LANGFLOW_FLOW_ID ||
  "26233de8-e4d6-427a-a2be-938d9990a93d";

export async function POST(request: NextRequest) {
  let body: { input_value?: string; session_id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const inputValue =
    typeof body.input_value === "string" ? body.input_value.trim() : "";
  if (!inputValue) {
    return NextResponse.json(
      { error: "Missing or empty input_value" },
      { status: 400 },
    );
  }

  const url = `${LANGFLOW_BASE_URL}/api/v1/run/${LANGFLOW_FLOW_ID}?stream=false`;

  const langflowBody = {
    input_value: inputValue,
    output_type: "chat",
    input_type: "chat",
    ...(body.session_id ? { session_id: body.session_id } : {}),
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(langflowBody),
      signal: AbortSignal.timeout(240_000),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[langflow] upstream error:", res.status, text.slice(0, 500));
      return NextResponse.json(
        {
          error:
            res.status === 404
              ? `Flow not found (${LANGFLOW_FLOW_ID}). Import the Genome Primer Design Agent JSON into Langflow and verify the flow ID.`
              : `Langflow error (${res.status}): ${text.slice(0, 200)}`,
        },
        { status: 502 },
      );
    }

    const data = await res.json();

    const outputMessage = extractOutputMessage(data);

    return NextResponse.json({
      message: outputMessage,
      session_id: data.session_id ?? null,
      raw: data,
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    const isTimeout =
      err.message.toLowerCase().includes("timeout") ||
      err.message.toLowerCase().includes("abort");

    if (isTimeout) {
      return NextResponse.json(
        {
          error:
            "Langflow is taking longer than expected. The agent may still be processing — try again in a moment.",
        },
        { status: 504 },
      );
    }

    const isConnError =
      err.message.includes("fetch") ||
      err.message.includes("ECONNREFUSED") ||
      err.message.includes("ENOTFOUND");

    if (isConnError) {
      return NextResponse.json(
        {
          error:
            'Could not reach Langflow. Make sure it\'s running (pip install langflow && langflow run) and LANGFLOW_BASE_URL is set correctly.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}

function extractOutputMessage(data: Record<string, unknown>): string {
  try {
    const outputs = data.outputs as Array<{
      outputs?: Array<{
        results?: { message?: { text?: string } };
        messages?: Array<{ message?: string }>;
      }>;
    }>;

    if (Array.isArray(outputs)) {
      for (const output of outputs) {
        if (Array.isArray(output.outputs)) {
          for (const inner of output.outputs) {
            if (inner.results?.message?.text) {
              return inner.results.message.text;
            }
            if (Array.isArray(inner.messages) && inner.messages.length > 0) {
              const last = inner.messages[inner.messages.length - 1];
              if (last?.message) return last.message;
            }
          }
        }
      }
    }
  } catch {
    // fall through
  }
  return JSON.stringify(data);
}
