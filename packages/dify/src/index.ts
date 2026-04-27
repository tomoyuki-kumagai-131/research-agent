export interface DifyClientOptions {
  apiBase?: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
}

export interface RunWorkflowParams {
  inputs: Record<string, unknown>;
  user: string;
  responseMode?: "blocking" | "streaming";
}

export interface DifyWorkflowResponse {
  workflow_run_id: string;
  task_id: string;
  data: {
    id: string;
    workflow_id: string;
    status: "succeeded" | "failed" | "running";
    outputs: Record<string, unknown>;
    error?: string;
    elapsed_time?: number;
    total_tokens?: number;
  };
}

export class DifyClient {
  private readonly apiBase: string;
  private readonly apiKey: string;
  private readonly fetchImpl: typeof fetch;

  constructor(options: DifyClientOptions) {
    this.apiBase = options.apiBase ?? "https://api.dify.ai/v1";
    this.apiKey = options.apiKey;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async runWorkflow(params: RunWorkflowParams): Promise<DifyWorkflowResponse> {
    const res = await this.fetchImpl(`${this.apiBase}/workflows/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: params.inputs,
        user: params.user,
        response_mode: params.responseMode ?? "blocking",
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Dify workflow failed: ${res.status} ${text}`);
    }

    return (await res.json()) as DifyWorkflowResponse;
  }

  async *streamWorkflow(params: RunWorkflowParams): AsyncGenerator<unknown> {
    const res = await this.fetchImpl(`${this.apiBase}/workflows/run`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: params.inputs,
        user: params.user,
        response_mode: "streaming",
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Dify stream failed: ${res.status}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          yield JSON.parse(payload);
        } catch {
          // ignore malformed chunk
        }
      }
    }
  }
}
