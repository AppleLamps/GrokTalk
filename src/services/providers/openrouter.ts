import {
  APIOptions,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionStreamResponse,
  Message,
  StreamCallbacks,
  AIServiceProvider,
} from "./types";

// Endpoint
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

const prepareApiKey = (apiKey: string): string => {
  if (!apiKey) throw new Error("API Key is required");
  const cleanKey = apiKey.trim();
  if (cleanKey.toLowerCase().startsWith("bearer ")) return cleanKey.slice(7);
  return cleanKey;
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const prepareRequestLog = (url: string, body: ChatCompletionRequest) =>
  JSON.stringify({ url, method: "POST", body: { ...body, messages: body.messages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? (m.content as string).slice(0, 50) : '[complex]' })) } }, null, 2);

const handleApiError = async (response: Response): Promise<never> => {
  let txt = await response.text().catch(() => "");
  let msg = `Error: ${response.status} ${response.statusText}`;
  try {
    const data = JSON.parse(txt);
    msg = data?.error?.message || msg;
  } catch {}
  if (response.status === 401) throw new Error("Authentication failed: Invalid API key.");
  if (response.status === 429) throw new Error("Rate limit exceeded. Please try again later.");
  throw new Error(msg);
};

export const openRouterProvider: AIServiceProvider = {
  async sendMessage(messages: Message[], apiKey: string, options: APIOptions = {}) {
    const cleanApiKey = prepareApiKey(apiKey);
    let retries = 0; let lastError: any = null;
    while (retries <= MAX_RETRIES) {
      try {
        const requestBody: ChatCompletionRequest = {
          model: options.model || "x-ai/grok-4",
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 8192,
        };

        console.log("OpenRouter send (attempt " + (retries + 1) + "):", prepareRequestLog(OPENROUTER_URL, requestBody));

        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cleanApiKey}`,
            "Accept": "application/json",
            "HTTP-Referer": (typeof window !== 'undefined' ? window.location.origin : '') || "",
            "X-Title": "GrokTalk"
          },
          body: JSON.stringify(requestBody)
        });
        if (!res.ok) await handleApiError(res);
        const data: ChatCompletionResponse = await res.json();
        return data.choices[0].message.content;
      } catch (err) {
        lastError = err; retries++; if (retries > MAX_RETRIES) break; await delay(RETRY_DELAY * retries);
      }
    }
    throw new Error(`Failed to get response from OpenRouter API: ${lastError instanceof Error ? lastError.message : 'Unknown error'}`);
  },

  async streamResponse(messages: Message[], apiKey: string, callbacks: StreamCallbacks, options: APIOptions = {}) {
    const cleanApiKey = prepareApiKey(apiKey);
    const { onChunk, onComplete, onError } = callbacks;
    let retries = 0; let aborted = false;
    while (retries <= MAX_RETRIES && !aborted) {
      try {
        const requestBody: ChatCompletionRequest = {
          model: options.model || "x-ai/grok-4",
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.max_tokens ?? 8192,
          stream: true,
        };

        console.log("OpenRouter stream (attempt " + (retries + 1) + "):", prepareRequestLog(OPENROUTER_URL, requestBody));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => { controller.abort(); aborted = true; onError(new Error("Request timed out after 30 seconds")); }, 30000);

        const res = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${cleanApiKey}`,
            "Accept": "application/json",
            "HTTP-Referer": (typeof window !== 'undefined' ? window.location.origin : '') || "",
            "X-Title": "GrokTalk"
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (aborted) return;
        if (!res.ok) await handleApiError(res);
        if (!res.body) throw new Error("Response body is null");

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = '';
        let done = false;

        while (!done && !aborted) {
          const { value, done: d } = await reader.read();
          done = d;
          if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              if (!line.trim()) continue;
              if (!line.startsWith('data: ')) continue;
              const data = line.substring(6);
              if (data === '[DONE]') { onComplete(); return; }
              try {
                const parsed: ChatCompletionStreamResponse = JSON.parse(data);
                const chunk = parsed.choices?.[0]?.delta?.content;
                if (chunk) onChunk(chunk);
              } catch {}
            }
          }
        }
        onComplete();
        return;
      } catch (err) {
        if (aborted) return; if (retries >= MAX_RETRIES) { onError(err as Error); return; }
        retries++; await delay(RETRY_DELAY * retries);
      }
    }
  },

  async callAI(opts) {
    const messages: Message[] = [];
    if (opts.projectInstructions) {
      messages.push({ role: 'system', content: opts.projectInstructions as string });
    }
    messages.push(...opts.messages.map(m => ({ role: m.role as any, content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) })));
    const apiKey = localStorage.getItem('apiKey') || '';
    if (!apiKey) throw new Error("API Key is required. Please set your API key in settings.");
    const content = await this.sendMessage(messages, apiKey, { max_tokens: opts.max_tokens, temperature: opts.temperature, model: opts.model });
    return { choices: [{ message: { content } }], quick_replies: [] };
  }
};


