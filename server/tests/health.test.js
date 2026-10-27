import { describe, expect, it } from 'vitest';
import { healthCheck } from '../src/app.js';

describe('GET /health', () => {
  it('reports that the API is available', async () => {
    const response = {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
      },
    };

    healthCheck({}, response);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toBe('ai-resume-analyzer-api');
  });
});
