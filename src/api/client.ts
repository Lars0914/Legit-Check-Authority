import { API_BASE_URL } from "../config";
import type {
  ArchiveCatalogResponse,
  ArchiveModelResponse,
  GuideResponse,
  PaymentsConfigResponse,
  SearchResponse,
  SubscriptionResponse,
  UsageLimitPayload,
} from "../types/api";

export interface AuthResponse {
  token: string;
  user: { id: number; mail: string };
}

let authToken: string | null = null;

export function setApiAuthToken(token: string | null): void {
  authToken = token;
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new Error(
      `Network request failed (${url}). Check API_BASE_URL in src/config.ts and that the backend is running.`,
    );
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

async function getJson<T>(path: string): Promise<T> {
  return requestJson<T>(path);
}

export function signUp(mail: string, password: string): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ mail, password }),
  });
}

export function signIn(mail: string, password: string): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/auth/signin", {
    method: "POST",
    body: JSON.stringify({ mail, password }),
  });
}

export function signInWithGoogle(idToken: string): Promise<AuthResponse> {
  return requestJson<AuthResponse>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ idToken }),
  });
}

export function requestPasswordReset(
  mail: string,
): Promise<{ message: string }> {
  return requestJson<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ mail }),
  });
}

export function resetPasswordWithCode(
  mail: string,
  code: string,
  password: string,
  confirmPassword: string,
): Promise<{ message: string }> {
  return requestJson<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      mail,
      code,
      password,
      confirmPassword,
    }),
  });
}

export class UsageLimitError extends Error {
  readonly payload: UsageLimitPayload;

  constructor(payload: UsageLimitPayload) {
    super(payload.error);
    this.name = "UsageLimitError";
    this.payload = payload;
  }
}

async function parseErrorBody(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function isUsageLimitPayload(body: unknown): body is UsageLimitPayload {
  return (
    typeof body === "object" &&
    body !== null &&
    (body as UsageLimitPayload).code === "USAGE_LIMIT_REACHED"
  );
}

export async function searchGuides(query: string): Promise<SearchResponse> {
  const q = encodeURIComponent(query.trim());
  const url = `${API_BASE_URL}/guides/search?q=${q}`;
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(url, { headers });
  if (res.status === 402) {
    const body = await parseErrorBody(res);
    if (isUsageLimitPayload(body)) {
      throw new UsageLimitError(body);
    }
  }
  if (!res.ok) {
    const body = (await parseErrorBody(res)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<SearchResponse>;
}

export class GuideLockedError extends Error {
  readonly payload: UsageLimitPayload;

  constructor(payload: UsageLimitPayload) {
    super(payload.error);
    this.name = "GuideLockedError";
    this.payload = payload;
  }
}

export async function fetchGuide(slug: string): Promise<GuideResponse> {
  const url = `${API_BASE_URL}/guides/${encodeURIComponent(slug)}`;
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(url, { headers });
  if (res.status === 402) {
    const body = await parseErrorBody(res);
    if (isUsageLimitPayload(body)) {
      throw new GuideLockedError(body);
    }
  }
  if (!res.ok) {
    const body = (await parseErrorBody(res)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }
  return res.json() as Promise<GuideResponse>;
}

export function fetchPaymentsConfig(): Promise<PaymentsConfigResponse> {
  return getJson<PaymentsConfigResponse>("/payments/config");
}

export function fetchSubscription(): Promise<SubscriptionResponse> {
  return getJson<SubscriptionResponse>("/payments/subscription");
}

export function createSubscriptionCheckout(): Promise<{
  clientSecret: string;
  subscriptionId: string;
}> {
  return requestJson("/payments/subscribe", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function confirmSubscription(
  subscriptionId: string,
): Promise<{ subscription: SubscriptionResponse["subscription"] }> {
  return requestJson("/payments/confirm-subscription", {
    method: "POST",
    body: JSON.stringify({ subscriptionId }),
  });
}

/** Vercel routes archive via /api?path= until rewrites are deployed. */
function archiveApiPath(segments: string, query = ""): string {
  const q = query ? `&q=${encodeURIComponent(query.trim())}` : "";
  return `/api?path=${segments}${q}`;
}

export function fetchArchiveCatalog(
  query = "",
): Promise<ArchiveCatalogResponse> {
  return getJson<ArchiveCatalogResponse>(
    archiveApiPath("archive/catalog", query),
  );
}

export function fetchArchiveModel(
  brandSlug: string,
  modelSlug: string,
): Promise<ArchiveModelResponse> {
  return getJson<ArchiveModelResponse>(
    archiveApiPath(
      `archive/${encodeURIComponent(brandSlug)}/${encodeURIComponent(modelSlug)}`,
    ),
  );
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
