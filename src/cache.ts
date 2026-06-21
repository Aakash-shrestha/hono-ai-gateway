export const hashPrompt = async (prompt: string): Promise<string> => {
  const encoder = new TextEncoder(); // emits a stream of utf-8 bytes
  const data = encoder.encode(prompt);

  const hashBuffer = await crypto.subtle.digest("SHA-256", data); // returns ArrayBuffer - raw binary data representing the hash
  // Array buffer is a raw byte, it cannot be stored in kv directly, so need to convert it into hex strings
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
};

export const getCached = async (
  cache: KVNamespace,
  key: string,
): Promise<string | null> => {
  const cachedData = await cache.get(key);
  return cachedData;
};

export const setCached = async (
  cache: KVNamespace,
  key: string,
  value: string,
  ttl: number,
): Promise<void> => {
  await cache.put(key, value, { expirationTtl: ttl });
};
