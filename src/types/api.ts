export interface SubscriptionInfo {
  plan: "free" | "pro";
  status: string | null;
  active: boolean;
  periodEnd: string | null;
  usageCount: number;
  usageLimit: number | null;
  periodKey: string;
  unlimited: boolean;
  lastViewedSlug: string | null;
}

export interface SearchResult {
  slug: string;
  fileName: string;
  brand: string | null;
  model: string | null;
  title: string | null;
  sectionCount?: number;
  score: number;
  premium: boolean;
  accessible?: boolean;
}

export interface SearchResponse {
  query: string;
  storage: string;
  count: number;
  results: SearchResult[];
  suggestion?: string | null;
  subscription?: SubscriptionInfo;
  proPriceCents?: number;
  currency?: string;
  freeMonthlyLimit?: number;
}

export interface UsageLimitPayload {
  error: string;
  code: "USAGE_LIMIT_REACHED";
  plan: "free" | "pro";
  usageCount: number;
  usageLimit: number | null;
  periodKey: string;
  upgradePriceCents: number;
  currency: string;
  slug?: string;
}

export interface PaymentsConfigResponse {
  stripeEnabled: boolean;
  publishableKey: string | null;
  proPriceCents: number;
  currency: string;
  freeMonthlyLimit: number;
}

export interface SubscriptionResponse {
  subscription: SubscriptionInfo;
  proPriceCents: number;
  currency: string;
  freeMonthlyLimit: number;
}

export interface SectionText {
  text: string;
}

export interface PhotoRef {
  fileName: string;
  storagePath: string;
  url: string;
  cropHint: string | null;
  caption: string | null;
  found: boolean;
}

export interface GuideSection {
  id: string;
  title: string;
  genuine: SectionText | null;
  counterfeit: SectionText | null;
  content: string | null;
  comparisonInsight: string | null;
  photos: {
    genuine: PhotoRef | null;
    counterfeit: PhotoRef | null;
    reference: PhotoRef | null;
  };
  notes: string[];
}

export interface Guide {
  slug: string;
  fileName: string;
  brand: string | null;
  model: string | null;
  title: string | null;
  sourceImages: string[];
  sections: GuideSection[];
  missingImages?: string[];
}

export interface GuideResponse {
  storage: string;
  guide: Guide;
  premium?: boolean;
  subscription?: SubscriptionInfo;
}

export interface ArchiveModel {
  id: string;
  name: string;
  slug: string;
  folderPath: string;
  imageCount: number;
}

export interface ArchiveBrand {
  id: string;
  name: string;
  slug: string;
  folderPath: string;
  models: ArchiveModel[];
}

export interface ArchiveCatalogResponse {
  storage: string;
  query: string;
  count: number;
  brands: ArchiveBrand[];
}

export interface ArchiveImage {
  fileName: string;
  storagePath: string;
  url: string;
}

export interface ArchiveModelResponse {
  storage: string;
  brand: string;
  brandSlug: string;
  model: string;
  modelSlug: string;
  images: ArchiveImage[];
}
