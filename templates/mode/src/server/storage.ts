// In memory: gone when the resource restarts. `varion new --db` uses MariaDB instead.
const visits = new Map<string, number>();

export async function openStorage(): Promise<string> {
  return 'memory (until the resource restarts)';
}

// counts one more visit of the player and returns how many there are now
export async function addVisit(key: string): Promise<number> {
  const total = (visits.get(key) ?? 0) + 1;
  visits.set(key, total);
  return total;
}

export async function closeStorage(): Promise<void> {}
