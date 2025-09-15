// services/ragService.ts
export type RagContext = { text: string; source?: string; score?: number | null };
export type RagResponse = { answer: string; contexts?: RagContext[] };

export async function sendMessageWithRAG(
  userText: string,
  digitalTwin: any,
  endpoint = "/api/v1/rag/chat"
): Promise<RagResponse> {
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: userText,
      digital_twin: digitalTwin,
      context_type: "learning",
      top_k: 5
    }),
  });
  if (!resp.ok) {
    const t = await resp.text().catch(() => "");
    throw new Error(`RAG call failed (${resp.status}): ${t}`);
  }
  return resp.json();
}
