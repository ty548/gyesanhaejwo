export async function lookupRate(fetcher, from, to) {
  if (from === to) return { rate: 1, date: null };
  try {
    const response = await fetcher(`https://api.frankfurter.dev/v2/rate/${from.toLowerCase()}/${to.toLowerCase()}`);
    if (!response.ok) throw new Error('rate unavailable');
    const data = await response.json();
    if (!(Number.isFinite(data.rate) && data.rate > 0) || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) throw new Error('invalid rate');
    return { rate: data.rate, date: data.date };
  } catch {
    return { rate: null, date: null };
  }
}
