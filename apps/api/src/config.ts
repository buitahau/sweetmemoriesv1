export function parsePort(value: string | undefined): number {
  if (value === undefined || value === '') {
    return 3000;
  }
  if (/^[0-9]+$/.test(value)) {
    const port = Number(value);
    if (port >= 1 && port <= 65535) {
      return port;
    }
  }
  throw new Error(`Invalid PORT: ${value}`);
}
