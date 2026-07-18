const memory = new Map<string, string>();
const SERVICE = "3d-movel-illustrator";

async function loadKeytar(): Promise<typeof import("keytar") | null> {
  if (process.env.MOVEL_E2E_SKIP_KEYTAR === "1") return null;
  try {
    return await import("keytar");
  } catch {
    return null;
  }
}

export async function setKey(providerId: string, key: string): Promise<void> {
  const keytar = await loadKeytar();
  if (!keytar) {
    memory.set(providerId, key);
    return;
  }
  await keytar.setPassword(SERVICE, providerId, key);
}

export async function getKey(providerId: string): Promise<string | null> {
  const keytar = await loadKeytar();
  if (!keytar) return memory.get(providerId) ?? null;
  return keytar.getPassword(SERVICE, providerId);
}

export async function deleteKey(providerId: string): Promise<void> {
  const keytar = await loadKeytar();
  if (!keytar) {
    memory.delete(providerId);
    return;
  }
  await keytar.deletePassword(SERVICE, providerId);
}
