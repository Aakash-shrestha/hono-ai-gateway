export function validateAuth(
  authHeader: string | undefined,
  gatewayApiKey: string,
): boolean {
  if (!authHeader) return false;
  const token = authHeader.split(" ")[1];
  return token === gatewayApiKey;
}
