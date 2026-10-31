const entries = new Map<string, { count: number; resetAt: number }>();
export function checkRateLimit(identifier: string) {
  const now = Date.now();
  for (const [key,value] of entries) if (value.resetAt <= now) entries.delete(key);
  const entry = entries.get(identifier);
  if (!entry) {
    if (entries.size >= 10000) return {allowed:false,remaining:0,resetIn:60000};
    entries.set(identifier,{count:1,resetAt:now+60000});
    return {allowed:true,remaining:4,resetIn:60000};
  }
  if (entry.count >= 5) return {allowed:false,remaining:0,resetIn:entry.resetAt-now};
  entry.count++;
  return {allowed:true,remaining:5-entry.count,resetIn:entry.resetAt-now};
}
