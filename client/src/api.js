const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function request(path, { token, headers, ...options } = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: { ...(token && { Authorization: `Bearer ${token}` }), ...headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(payload.error?.message ?? 'Something went wrong. Please try again.');
  return payload;
}

export const api = {
  register: (input) =>
    request('/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }),
  login: (input) =>
    request('/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }),
  getMe: (token) => request('/auth/me', { token }),
  uploadResume: (file, token) => {
    const body = new FormData();
    body.append('resume', file);
    return request('/resumes', { method: 'POST', token, body });
  },
  analyze: (input, token) =>
    request('/analyses', {
      method: 'POST',
      token,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(input),
    }),
  listAnalyses: (token) => request('/analyses', { token }),
  getAnalysis: (analysisId, token) => request(`/analyses/${analysisId}`, { token }),
};
