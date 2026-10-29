// In memory: gone when the resource restarts. `varion new --db` uses MariaDB instead.
const clicks = new Map<string, number>();

export async function openStorage(): Promise<string> {
  return 'memory (until the resource restarts)';
}

export async function clicksOf(key: string): Promise<number> {
  return clicks.get(key) ?? 0;
}

export async function addClick(key: string): Promise<number> {
  const total = (clicks.get(key) ?? 0) + 1;
  clicks.set(key, total);
  return total;
}

export async function closeStorage(): Promise<void> {}
