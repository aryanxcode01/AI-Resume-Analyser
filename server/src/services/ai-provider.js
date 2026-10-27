import { env } from '../config/env.js';

const defaultRequestTimeoutMs = 20_000;

function responseText(payload) {
  return payload?.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
}

export class GeminiProvider {
  constructor({
    apiKey = env.geminiApiKey,
    model = env.geminiModel,
    fetchImpl = fetch,
    requestTimeoutMs = defaultRequestTimeoutMs,
  } = {}) {
    this.apiKey = apiKey;
    this.model = model;
    this.fetchImpl = fetchImpl;
    this.requestTimeoutMs = requestTimeoutMs;
  }

  get isConfigured() {
    return Boolean(this.apiKey && this.apiKey !== 'your-free-gemini-api-key');
  }

  async generateJson({ prompt, jsonSchema, resultSchema }) {
    if (!this.isConfigured) return null;

    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
        try {
          const response = await this.fetchImpl(
            `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
            {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              signal: controller.signal,
              body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0,
                  responseMimeType: 'application/json',
                  responseJsonSchema: jsonSchema,
                },
              }),
            },
          );
          if (!response.ok) throw new Error(`Gemini request failed with status ${response.status}`);
          const payload = await response.json();
          return resultSchema.parse(JSON.parse(responseText(payload)));
        } finally {
          clearTimeout(timeout);
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw new Error(`AI_PROVIDER_FAILED: ${lastError?.name ?? 'UnknownError'}`);
  }
}
