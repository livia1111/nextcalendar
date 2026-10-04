type ApiErrorLike = {
  response?: { data?: unknown };
  message?: string;
};

/**
 * O backend responde de 3 jeitos:
 *  - texto puro (BusinessException 400, EntityNotFound 404, conflitos 409);
 *  - lista [{ field, message }] na validação (422);
 *  - objeto { message } em alguns pontos.
 */
export function getApiErrorMessage(err: unknown, fallback: string): string {
  const e = err as ApiErrorLike | undefined;
  const data = e?.response?.data;

  if (typeof data === 'string' && data.trim()) return data;

  if (Array.isArray(data)) {
    const msgs = data
      .map((d) => (d && typeof d === 'object' ? (d as { message?: string }).message : undefined))
      .filter((m): m is string => !!m);
    if (msgs.length) return msgs.join('\n');
  }

  if (data && typeof data === 'object') {
    const m = (data as { message?: string }).message;
    if (m) return m;
  }

  return e?.message || fallback;
}