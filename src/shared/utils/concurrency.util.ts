export async function runWithLimit<T>(
  tasks: (() => Promise<T>)[],
  limit: number,
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const current = index++;
      try {
        const res = await tasks[current]();
        results[current] = res;
      } catch {
        results[current] = null as any;
      }
    }
  }

  const workers = Array.from({ length: limit }, () => worker());

  await Promise.all(workers);

  return results;
}