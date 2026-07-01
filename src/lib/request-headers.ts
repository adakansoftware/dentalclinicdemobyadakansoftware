export function headersFromNodeRequest(input: Record<string, string | string[] | undefined>) {
  const headers = new Headers();

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      headers.set(key, value);
      continue;
    }

    if (Array.isArray(value) && value.length > 0) {
      headers.set(key, value.join(", "));
    }
  }

  return headers;
}
