const CF_API = "https://api.cloudflare.com/client/v4";

interface CFResponse {
  success: boolean;
  errors: { message: string }[];
  result: Record<string, unknown> | Record<string, unknown>[];
}

async function cfFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<CFResponse> {
  const res = await fetch(`${CF_API}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  return res.json() as Promise<CFResponse>;
}

export async function createMXRecord(
  token: string,
  zoneId: string,
  domain: string,
  mailServer: string
) {
  return cfFetch(`/zones/${zoneId}/dns_records`, token, {
    method: "POST",
    body: JSON.stringify({
      type: "MX",
      name: domain,
      content: mailServer,
      priority: 10,
      ttl: 3600,
    }),
  });
}

export async function createSPFRecord(
  token: string,
  zoneId: string,
  domain: string
) {
  return cfFetch(`/zones/${zoneId}/dns_records`, token, {
    method: "POST",
    body: JSON.stringify({
      type: "TXT",
      name: domain,
      content: "v=spf1 mx ~all",
      ttl: 3600,
    }),
  });
}

export async function listDNSRecords(
  token: string,
  zoneId: string,
  domain: string,
  type: "MX" | "TXT"
) {
  return cfFetch(
    `/zones/${zoneId}/dns_records?name=${encodeURIComponent(domain)}&type=${type}`,
    token,
    { method: "GET" }
  );
}

export async function deleteDNSRecord(
  token: string,
  zoneId: string,
  recordId: string
) {
  return cfFetch(`/zones/${zoneId}/dns_records/${recordId}`, token, {
    method: "DELETE",
  });
}

export async function setupDomainDNS(
  token: string,
  zoneId: string,
  domain: string,
  mailServer: string
): Promise<{ ok: boolean; errors: string[] }> {
  const errors: string[] = [];

  const mx = await createMXRecord(token, zoneId, domain, mailServer);
  if (!mx.success) errors.push(`MX: ${mx.errors.map((e) => e.message).join(", ")}`);

  const spf = await createSPFRecord(token, zoneId, domain);
  if (!spf.success) errors.push(`SPF: ${spf.errors.map((e) => e.message).join(", ")}`);

  return { ok: errors.length === 0, errors };
}

export async function removeDomainDNS(
  token: string,
  zoneId: string,
  domain: string
): Promise<{ ok: boolean; errors: string[] }> {
  const errors: string[] = [];

  for (const type of ["MX", "TXT"] as const) {
    const list = await listDNSRecords(token, zoneId, domain, type);
    if (!list.success) {
      errors.push(`List ${type}: ${list.errors.map((e) => e.message).join(", ")}`);
      continue;
    }
    const records = list.result as Record<string, unknown>[];
    for (const rec of records) {
      if (type === "TXT" && rec.content !== "v=spf1 mx ~all") continue;
      const del = await deleteDNSRecord(token, zoneId, rec.id as string);
      if (!del.success) errors.push(`Delete ${type}: ${del.errors.map((e) => e.message).join(", ")}`);
    }
  }

  return { ok: errors.length === 0, errors };
}
