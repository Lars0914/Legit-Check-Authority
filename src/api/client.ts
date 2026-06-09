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

export type ApprovalStatus = "pending" | "approved" | "denied";

export interface SignUpResponse {
  user: { id: number; mail: string };
  token?: string;
  approvalStatus: ApprovalStatus;
  message: string;
}

let authToken: string | null = null;

const NETWORK_RETRIES = 2;

export function setApiAuthToken(token: string | null): void {
  authToken = token;
}

export function toApiUrl(path: string): string {
  const trimmed = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL.replace(/\/$/, "")}${trimmed}`;
}

function formatNetworkError(url: string, err: unknown): string {
  const detail =
    err instanceof Error && err.message.trim()
      ? err.message.trim()
      : "Could not reach the server";
  if (detail === "Network request failed") {
    return `Cannot reach the API (${url}). Check Wi‑Fi or mobile data, then rebuild the app if you just updated networking code.`;
  }
  return `Cannot reach the API (${url}). ${detail}`;
}

async function fetchWithRetry(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= NETWORK_RETRIES; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (err) {
      lastError = err;
      if (attempt < NETWORK_RETRIES) {
        await new Promise<void>((resolve) => {
          setTimeout(() => resolve(), 1500 * (attempt + 1));
        });
      }
    }
  }
  throw new Error(formatNetworkError(url, lastError));
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = toApiUrl(path);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetchWithRetry(url, { ...init, headers });

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

export function signUp(mail: string, password: string): Promise<SignUpResponse> {
  return requestJson<SignUpResponse>("/auth/signup", {
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
  const url = toApiUrl(`guides/search?q=${q}`);
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetchWithRetry(url, { headers });
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
  const url = toApiUrl(`guides/${encodeURIComponent(slug)}`);
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetchWithRetry(url, { headers });
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

function archiveApiPath(segments: string, query = ""): string {
  const q = query ? `?q=${encodeURIComponent(query.trim())}` : "";
  return `${segments}${q}`;
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
    const res = await fetchWithRetry(toApiUrl("health"));
    return res.ok;
  } catch {
    return false;
  }
}
