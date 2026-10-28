// "next" = the student page (e.g. an event QR link) to return to after
// login/signup. Only same-site /student/ paths are accepted.
export function safeNextPath(raw: string | null | undefined): string {
  return raw && /^\/student\/[\w\-\/]*$/.test(raw) ? raw : '';
}

export function withNext(path: string, next: string): string {
  if (!next) return path;
  return `${path}${path.includes('?') ? '&' : '?'}next=${encodeURIComponent(next)}`;
}
