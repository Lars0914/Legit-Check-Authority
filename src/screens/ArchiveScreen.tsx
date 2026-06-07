import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { checkApiHealth, fetchArchiveCatalog, fetchArchiveModel } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  API_BASE_URL,
  APP_DISPLAY_NAME,
  AUTH_ENABLED,
  paymentsUiEnabled,
} from "../config";
import { ArchiveImage } from "../components/ArchiveImage";
import { ArchiveImageViewer } from "../components/ArchiveImageViewer";
import { ScreenChrome } from "../components/ScreenChrome";
import { prefetchArchiveImages } from "../lib/imageUrl";
import { useResponsiveLayout } from "../lib/responsive";
import { theme } from "../theme";
import type { ArchiveBrand, ArchiveImage as ArchiveImageType, ArchiveModel } from "../types/api";

interface Props {
  onOpenSubscription?: () => void;
}

interface FlatResult {
  brand: ArchiveBrand;
  model: ArchiveModel;
}

function modelKey(brandSlug: string, modelSlug: string): string {
  return `${brandSlug}:${modelSlug}`;
}

function brandMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function HighlightText({
  text,
  query,
  style,
  highlightStyle,
}: {
  text: string;
  query: string;
  style?: object;
  highlightStyle?: object;
}) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return <Text style={style}>{text}</Text>;
  }

  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx < 0) {
    return <Text style={style}>{text}</Text>;
  }

  return (
    <Text style={style}>
      {text.slice(0, idx)}
      <Text style={[style, highlightStyle]}>{text.slice(idx, idx + q.length)}</Text>
      {text.slice(idx + q.length)}
    </Text>
  );
}

export function ArchiveScreen({ onOpenSubscription }: Props) {
  const auth = useAuth();
  const user = AUTH_ENABLED ? auth.user : null;
  const signOut = AUTH_ENABLED ? auth.signOut : async () => {};
  const showPayments = paymentsUiEnabled();

  const [query, setQuery] = useState("");
  const [brands, setBrands] = useState<ArchiveBrand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [focused, setFocused] = useState(false);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [modelImages, setModelImages] = useState<
    Record<string, ArchiveImageType[]>
  >({});
  const [loadingModel, setLoadingModel] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const autoOpenedRef = useRef<string | null>(null);

  const { isWide, sidebarWidth } = useResponsiveLayout();

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  useEffect(() => {
    checkApiHealth().then(setApiOk);
  }, []);

  const loadCatalog = useCallback(async (text: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchArchiveCatalog(text);
      setBrands(data.brands);
    } catch (e) {
      setBrands([]);
      setError(e instanceof Error ? e.message : "Failed to load catalog");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      loadCatalog(query);
    }, 250);
    return () => clearTimeout(t);
  }, [query, loadCatalog]);

  const flatResults = useMemo<FlatResult[]>(() => {
    if (!isSearching) return [];
    const results: FlatResult[] = [];
    for (const brand of brands) {
      for (const model of brand.models) {
        results.push({ brand, model });
      }
    }
    return results;
  }, [brands, isSearching]);

  const totalModels = useMemo(
    () => brands.reduce((sum, brand) => sum + brand.models.length, 0),
    [brands],
  );

  const loadModelImages = useCallback(
    async (brandSlug: string, modelSlug: string) => {
      const key = modelKey(brandSlug, modelSlug);
      if (modelImages[key]?.length) return;

      setLoadingModel(key);
      try {
        const detail = await fetchArchiveModel(brandSlug, modelSlug);
        setModelImages((prev) => ({ ...prev, [key]: detail.images }));
        prefetchArchiveImages(detail.images.map((img) => img.url));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load images");
      } finally {
        setLoadingModel(null);
      }
    },
    [modelImages],
  );

  const openModel = useCallback(
    (brandSlug: string, modelSlug: string) => {
      const key = modelKey(brandSlug, modelSlug);
      setExpandedBrand(brandSlug);
      setExpandedModel(key);
      setSelectedImageIndex(0);
      loadModelImages(brandSlug, modelSlug);
    },
    [loadModelImages],
  );

  const selectedMeta = useMemo(() => {
    if (!expandedModel) return null;
    for (const brand of brands) {
      for (const model of brand.models) {
        if (modelKey(brand.slug, model.slug) === expandedModel) {
          return { brand, model };
        }
      }
    }
    return null;
  }, [brands, expandedModel]);

  const toggleBrand = useCallback((brandSlug: string) => {
    setExpandedBrand((prev) => (prev === brandSlug ? null : brandSlug));
    setExpandedModel(null);
  }, []);

  const toggleModel = useCallback(
    (brandSlug: string, modelSlug: string) => {
      const key = modelKey(brandSlug, modelSlug);
      if (expandedModel === key) {
        setExpandedModel(null);
        return;
      }
      openModel(brandSlug, modelSlug);
    },
    [expandedModel, openModel],
  );

  useEffect(() => {
    if (!isSearching) {
      autoOpenedRef.current = null;
      return;
    }
    if (flatResults.length !== 1 || loading) return;

    const { brand, model } = flatResults[0];
    const key = modelKey(brand.slug, model.slug);
    if (autoOpenedRef.current === key) return;

    autoOpenedRef.current = key;
    openModel(brand.slug, model.slug);
  }, [flatResults, isSearching, loading, openModel]);

  const renderModelImages = (brandSlug: string, modelSlug: string) => {
    const key = modelKey(brandSlug, modelSlug);
    const images = modelImages[key] ?? [];

    return (
      <View style={styles.imagePanel}>
        {loadingModel === key ? (
          <ActivityIndicator
            color={theme.colors.accentGold}
            style={styles.modelLoader}
          />
        ) : null}
        {images.map((image, index) => (
          <ArchiveImage
            key={image.storagePath}
            image={image}
            priority={index < 3}
          />
        ))}
        {!loadingModel && images.length === 0 ? (
          <Text style={styles.emptyImages}>No images found for this model.</Text>
        ) : null}
      </View>
    );
  };

  const renderSearchResult = ({ brand, model }: FlatResult, wide = false) => {
    const key = modelKey(brand.slug, model.slug);
    const open = expandedModel === key;

    if (wide) {
      return (
        <Pressable
          key={key}
          style={({ pressed }) => [
            styles.wideModelRow,
            open && styles.wideModelRowActive,
            pressed && styles.rowPressed,
          ]}
          onPress={() => openModel(brand.slug, model.slug)}>
          <View style={styles.wideModelBody}>
            <Text style={styles.wideModelBrand}>{brand.name}</Text>
            <HighlightText
              text={model.name}
              query={trimmedQuery}
              style={styles.wideModelTitle}
              highlightStyle={styles.highlight}
            />
          </View>
          <Text style={styles.wideModelCount}>{model.imageCount}</Text>
        </Pressable>
      );
    }

    return (
      <View key={key} style={[styles.resultCard, open && styles.resultCardOpen]}>
        <Pressable
          style={({ pressed }) => [
            styles.resultRow,
            pressed && styles.rowPressed,
          ]}
          onPress={() => toggleModel(brand.slug, model.slug)}>
          <View style={styles.resultBody}>
            <Text style={styles.resultBrand}>{brand.name}</Text>
            <HighlightText
              text={model.name}
              query={trimmedQuery}
              style={styles.resultTitle}
              highlightStyle={styles.highlight}
            />
            <View style={styles.resultMetaRow}>
              <View style={styles.countPill}>
                <Text style={styles.countPillText}>
                  {model.imageCount} photo{model.imageCount === 1 ? "" : "s"}
                </Text>
              </View>
              <Text style={styles.resultHint}>
                {open ? "Hide photos" : "View photos"}
              </Text>
            </View>
          </View>
          <View style={[styles.chevronCircle, open && styles.chevronCircleOpen]}>
            <Text style={styles.chevron}>{open ? "▴" : "▾"}</Text>
          </View>
        </Pressable>
        {open ? renderModelImages(brand.slug, model.slug) : null}
      </View>
    );
  };

  const renderBrowseBrand = (brand: ArchiveBrand, wide = false) => {
    const brandOpen = expandedBrand === brand.slug;

    if (wide) {
      return (
        <View key={brand.id} style={styles.wideBrandBlock}>
          <Pressable
            style={({ pressed }) => [
              styles.wideBrandRow,
              brandOpen && styles.wideBrandRowOpen,
              pressed && styles.rowPressed,
            ]}
            onPress={() => toggleBrand(brand.slug)}>
            <Text style={styles.wideBrandTitle} numberOfLines={1}>
              {brand.name}
            </Text>
            <Text style={styles.wideBrandChevron}>{brandOpen ? "▴" : "▾"}</Text>
          </Pressable>
          {brandOpen
            ? brand.models.map((model) => {
                const key = modelKey(brand.slug, model.slug);
                const selected = expandedModel === key;
                return (
                  <Pressable
                    key={model.id}
                    style={({ pressed }) => [
                      styles.wideModelRow,
                      selected && styles.wideModelRowActive,
                      pressed && styles.rowPressed,
                    ]}
                    onPress={() => openModel(brand.slug, model.slug)}>
                    <Text
                      style={[
                        styles.wideModelTitle,
                        selected && styles.wideModelTitleActive,
                      ]}
                      numberOfLines={2}>
                      {model.name}
                    </Text>
                    <Text style={styles.wideModelCount}>{model.imageCount}</Text>
                  </Pressable>
                );
              })
            : null}
        </View>
      );
    }

    return (
      <View key={brand.id} style={styles.brandCard}>
        <Pressable
          style={({ pressed }) => [
            styles.brandRow,
            brandOpen && styles.brandRowOpen,
            pressed && styles.rowPressed,
          ]}
          onPress={() => toggleBrand(brand.slug)}>
          <View style={styles.brandAvatar}>
            <Text style={styles.brandAvatarText}>{brandMonogram(brand.name)}</Text>
          </View>
          <View style={styles.brandBody}>
            <Text style={styles.brandTitle}>{brand.name}</Text>
            <Text style={styles.brandMeta}>
              {brand.models.length} model{brand.models.length === 1 ? "" : "s"}
            </Text>
          </View>
          <View style={[styles.chevronCircle, brandOpen && styles.chevronCircleOpen]}>
            <Text style={styles.chevron}>{brandOpen ? "▴" : "▾"}</Text>
          </View>
        </Pressable>

        {brandOpen
          ? brand.models.map((model) => {
              const key = modelKey(brand.slug, model.slug);
              const modelOpen = expandedModel === key;

              return (
                <View key={model.id} style={styles.modelBlock}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.modelRow,
                      modelOpen && styles.modelRowOpen,
                      pressed && styles.rowPressed,
                    ]}
                    onPress={() => toggleModel(brand.slug, model.slug)}>
                    <View style={styles.modelDot} />
                    <View style={styles.modelTextWrap}>
                      <Text style={styles.modelTitle}>{model.name}</Text>
                      <Text style={styles.modelMeta}>
                        {model.imageCount} reference photo
                        {model.imageCount === 1 ? "" : "s"}
                      </Text>
                    </View>
                    <Text style={styles.modelChevron}>{modelOpen ? "▴" : "▾"}</Text>
                  </Pressable>
                  {modelOpen ? renderModelImages(brand.slug, model.slug) : null}
                </View>
              );
            })
          : null}
      </View>
    );
  };

  const clearSearch = () => {
    setQuery("");
    setExpandedBrand(null);
    setExpandedModel(null);
    setSelectedImageIndex(0);
  };

  const searchBar = (
    <View
      style={[
        styles.searchShell,
        isWide && styles.searchShellWide,
        focused && styles.searchShellFocused,
      ]}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        style={styles.input}
        placeholder="Search model, reference, or brand…"
        placeholderTextColor={theme.colors.textMuted}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {query.length > 0 ? (
        <Pressable onPress={clearSearch} hitSlop={8} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>✕</Text>
        </Pressable>
      ) : null}
    </View>
  );

  if (isWide) {
    const selectedImages = expandedModel
      ? modelImages[expandedModel] ?? []
      : [];

    return (
      <ScreenChrome>
        <View style={styles.wideRoot}>
          <View style={[styles.sidebar, { width: sidebarWidth }]}>
            <Text style={styles.sidebarHeading}>{APP_DISPLAY_NAME}</Text>
            {AUTH_ENABLED && user ? (
              <Text style={styles.sidebarGreeting}>
                Hi {user.mail.split("@")[0]}
              </Text>
            ) : null}

            {apiOk === false ? (
              <View style={styles.banner}>
                <Text style={styles.bannerText}>Cannot reach API.</Text>
              </View>
            ) : null}

            {searchBar}

            <View style={styles.sidebarSectionHeader}>
              <Text style={styles.sectionLabel}>
                {isSearching ? "Results" : "All brands"}
              </Text>
              <Text style={styles.sectionCount}>
                {isSearching
                  ? `${flatResults.length}`
                  : `${totalModels}`}
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator color={theme.colors.accentGold} />
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <ScrollView
              style={styles.sidebarList}
              contentContainerStyle={styles.sidebarListContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {!loading && isSearching && flatResults.length === 0 && !error ? (
                <Text style={styles.sidebarEmpty}>No models found.</Text>
              ) : null}
              {isSearching
                ? flatResults.map((item) => renderSearchResult(item, true))
                : brands.map((brand) => renderBrowseBrand(brand, true))}
            </ScrollView>
          </View>

          <View style={styles.mainPanel}>
            <ArchiveImageViewer
              brandName={selectedMeta?.brand.name ?? ""}
              modelName={selectedMeta?.model.name ?? ""}
              images={selectedImages}
              index={selectedImageIndex}
              loading={Boolean(
                expandedModel && loadingModel === expandedModel,
              )}
              onIndexChange={setSelectedImageIndex}
            />
          </View>
        </View>
      </ScreenChrome>
    );
  }

  return (
    <ScreenChrome>
      <View style={styles.container}>
        <View style={styles.hero}>
          {AUTH_ENABLED ? (
            <View style={styles.heroRow}>
              <View style={styles.heroActions}>
                {showPayments && onOpenSubscription ? (
                  <Pressable onPress={onOpenSubscription} hitSlop={8}>
                    <Text style={styles.paymentLink}>Plan</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => signOut()} hitSlop={8}>
                  <Text style={styles.signOut}>Sign out</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          <Text style={styles.heading}>{APP_DISPLAY_NAME}</Text>
          {AUTH_ENABLED && user ? (
            <Text style={styles.greeting}>
              Hi {user.mail.split("@")[0]} — find a model below
            </Text>
          ) : null}
        </View>

        {apiOk === false ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Cannot reach API. Start backend: npm run dev
            </Text>
            <Text style={styles.bannerUrl}>{API_BASE_URL}</Text>
          </View>
        ) : null}

        {searchBar}

        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            color={theme.colors.accentGold}
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>
            {isSearching ? "Search results" : "All brands"}
          </Text>
          <Text style={styles.sectionCount}>
            {isSearching
              ? `${flatResults.length} match${flatResults.length === 1 ? "" : "es"}`
              : `${totalModels} models`}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {!loading && isSearching && flatResults.length === 0 && !error ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No models found</Text>
              <Text style={styles.empty}>
                Try “Royal Oak”, “Daytona”, “AP”, or a reference number.
              </Text>
            </View>
          ) : null}

          {isSearching
            ? flatResults.map((item) => renderSearchResult(item, false))
            : brands.map((brand) => renderBrowseBrand(brand, false))}
        </ScrollView>
      </View>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  hero: { marginBottom: theme.spacing.md },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: theme.spacing.sm,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  paymentLink: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.accentCyan,
  },
  signOut: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.accent,
  },
  heading: {
    ...theme.font.hero,
    color: theme.colors.text,
  },
  greeting: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  banner: {
    backgroundColor: theme.colors.warningBg,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.35)",
    padding: 12,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },
  bannerText: { fontSize: 13, color: theme.colors.warning, lineHeight: 18 },
  bannerUrl: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  searchShell: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
    marginBottom: theme.spacing.sm,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  searchShellFocused: {
    borderColor: theme.colors.accentGold,
    backgroundColor: "#FFFCF7",
  },
  searchIcon: {
    fontSize: 18,
    color: theme.colors.accentGold,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: theme.colors.text,
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.pillBg,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  loader: { marginVertical: 12 },
  error: { color: theme.colors.error, marginBottom: 8 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
    marginTop: 4,
  },
  sectionLabel: {
    ...theme.font.label,
    color: theme.colors.textMuted,
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.colors.accentGold,
  },
  list: { paddingBottom: theme.spacing.xl },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 8,
  },
  empty: {
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
  },
  resultCard: {
    marginBottom: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  resultCardOpen: {
    borderColor: "rgba(180, 83, 9, 0.28)",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  resultBody: { flex: 1, paddingRight: 12 },
  resultBrand: {
    ...theme.font.label,
    color: theme.colors.accentGold,
    marginBottom: 6,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
    lineHeight: 24,
  },
  highlight: {
    color: theme.colors.accentGold,
    backgroundColor: "rgba(180, 83, 9, 0.12)",
  },
  resultMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: theme.colors.pillBg,
  },
  countPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
  },
  resultHint: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.accentCyan,
  },
  brandCard: {
    marginBottom: 12,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
  },
  brandRowOpen: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: "#FFFCF7",
  },
  brandAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(180, 83, 9, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(180, 83, 9, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  brandAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: theme.colors.accentGold,
    letterSpacing: 0.5,
  },
  brandBody: { flex: 1 },
  brandTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
  },
  brandMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontWeight: "600",
  },
  modelBlock: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingLeft: 22,
    backgroundColor: theme.colors.bg,
  },
  modelRowOpen: {
    backgroundColor: theme.colors.surfaceHover,
  },
  modelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.accentGold,
    marginRight: 12,
  },
  modelTextWrap: { flex: 1, paddingRight: 8 },
  modelTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    lineHeight: 21,
  },
  modelMeta: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  modelChevron: {
    fontSize: 13,
    color: theme.colors.accent,
  },
  imagePanel: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: theme.colors.bg,
  },
  modelLoader: { marginVertical: 16 },
  emptyImages: {
    textAlign: "center",
    color: theme.colors.textMuted,
    fontSize: 13,
    paddingVertical: 12,
  },
  chevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.pillBg,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronCircleOpen: {
    backgroundColor: "rgba(180, 83, 9, 0.12)",
  },
  chevron: {
    fontSize: 12,
    color: theme.colors.accentGold,
    fontWeight: "700",
  },
  rowPressed: { opacity: 0.86 },
  wideRoot: {
    flex: 1,
    flexDirection: "row",
  },
  sidebar: {
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  sidebarHeading: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 4,
  },
  sidebarGreeting: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  sidebarSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
    marginTop: 4,
  },
  sidebarList: { flex: 1 },
  sidebarListContent: { paddingBottom: theme.spacing.lg },
  sidebarEmpty: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
  },
  mainPanel: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  searchShellWide: {
    marginBottom: theme.spacing.md,
  },
  wideBrandBlock: {
    marginBottom: 8,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    backgroundColor: theme.colors.bg,
  },
  wideBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
  },
  wideBrandRowOpen: {
    backgroundColor: "#FFFCF7",
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  wideBrandTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: theme.colors.text,
    paddingRight: 8,
  },
  wideBrandChevron: {
    fontSize: 12,
    color: theme.colors.accentGold,
  },
  wideModelRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    paddingLeft: 18,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.bg,
  },
  wideModelRowActive: {
    backgroundColor: "rgba(180, 83, 9, 0.1)",
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accentGold,
    paddingLeft: 15,
  },
  wideModelBody: { flex: 1, paddingRight: 8 },
  wideModelBrand: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: theme.colors.accentGold,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  wideModelTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.text,
    lineHeight: 18,
  },
  wideModelTitleActive: {
    color: theme.colors.accentGold,
  },
  wideModelCount: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textMuted,
    minWidth: 18,
    textAlign: "right",
  },
});
