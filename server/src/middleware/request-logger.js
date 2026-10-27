export function requestLogger(request, response, next) {
  const startedAt = performance.now();
  response.on('finish', () => {
    // Deliberately exclude body, headers, query values, filenames, and user identifiers.
    console.info(
      JSON.stringify({
        event: 'request_complete',
        method: request.method,
        path: request.baseUrl + request.path,
        status: response.statusCode,
        durationMs: Math.round(performance.now() - startedAt),
      }),
    );
  });
  next();
}
