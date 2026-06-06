import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { ScreenChrome } from "../components/ScreenChrome";
import { prefetchArchiveImages } from "../lib/imageUrl";
import { theme } from "../theme";
import type { ArchiveBrand, ArchiveImage as ArchiveImageType } from "../types/api";

interface Props {
  onOpenSubscription?: () => void;
}

function modelKey(brandSlug: string, modelSlug: string): string {
  return `${brandSlug}:${modelSlug}`;
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

  const toggleBrand = useCallback((brandSlug: string) => {
    setExpandedBrand((prev) => (prev === brandSlug ? null : brandSlug));
    setExpandedModel(null);
  }, []);

  const toggleModel = useCallback(
    (brandSlug: string, modelSlug: string) => {
      const key = modelKey(brandSlug, modelSlug);
      setExpandedModel((prev) => (prev === key ? null : key));
      if (expandedModel !== key) {
        loadModelImages(brandSlug, modelSlug);
      }
    },
    [expandedModel, loadModelImages],
  );

  const totalModels = useMemo(
    () => brands.reduce((sum, brand) => sum + brand.models.length, 0),
    [brands],
  );

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
            <Text style={styles.sub}>
              Hi {user.mail.split("@")[0]} — browse the watch archive
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

        <View style={[styles.searchWrap, focused && styles.searchWrapFocused]}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.input}
            placeholder="Search brand or model…"
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            color={theme.colors.accentCyan}
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.sectionLabel}>
          Watch brand list · {totalModels} model{totalModels === 1 ? "" : "s"}
        </Text>

        <ScrollView
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {brands.length === 0 && !loading && !error ? (
            <Text style={styles.empty}>No watches match your search.</Text>
          ) : null}

          {brands.map((brand) => {
            const brandOpen = expandedBrand === brand.slug;
            return (
              <View key={brand.id} style={styles.brandBlock}>
                <Pressable
                  style={({ pressed }) => [
                    styles.brandRow,
                    brandOpen && styles.brandRowOpen,
                    pressed && styles.rowPressed,
                  ]}
                  onPress={() => toggleBrand(brand.slug)}>
                  <Text style={styles.brandTitle}>{brand.name}</Text>
                  <Text style={styles.chevron}>{brandOpen ? "▴" : "▾"}</Text>
                </Pressable>

                {brandOpen
                  ? brand.models.map((model) => {
                      const key = modelKey(brand.slug, model.slug);
                      const modelOpen = expandedModel === key;
                      const images = modelImages[key] ?? [];

                      return (
                        <View key={model.id} style={styles.modelBlock}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.modelRow,
                              modelOpen && styles.modelRowOpen,
                              pressed && styles.rowPressed,
                            ]}
                            onPress={() => toggleModel(brand.slug, model.slug)}>
                            <View style={styles.modelTextWrap}>
                              <Text style={styles.modelTitle}>{model.name}</Text>
                              <Text style={styles.modelMeta}>
                                {model.imageCount} image
                                {model.imageCount === 1 ? "" : "s"}
                              </Text>
                            </View>
                            <Text style={styles.chevron}>
                              {modelOpen ? "▴" : "▾"}
                            </Text>
                          </Pressable>

                          {modelOpen ? (
                            <View style={styles.imagePanel}>
                              {loadingModel === key ? (
                                <ActivityIndicator
                                  color={theme.colors.accentCyan}
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
                                <Text style={styles.emptyImages}>
                                  No images found for this model.
                                </Text>
                              ) : null}
                            </View>
                          ) : null}
                        </View>
                      );
                    })
                  : null}
              </View>
            );
          })}
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
  hero: { marginBottom: theme.spacing.lg },
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
  sub: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    marginTop: 6,
    lineHeight: 22,
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
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    marginBottom: theme.spacing.md,
  },
  searchWrapFocused: {
    borderColor: theme.colors.accentCyan,
    backgroundColor: theme.colors.surfaceHover,
  },
  searchIcon: {
    fontSize: 18,
    color: theme.colors.accentCyan,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  loader: { marginVertical: 12 },
  error: { color: theme.colors.error, marginBottom: 8 },
  sectionLabel: {
    ...theme.font.label,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  list: { paddingBottom: theme.spacing.xl },
  empty: {
    textAlign: "center",
    color: theme.colors.textMuted,
    marginTop: 24,
    fontSize: 14,
  },
  brandBlock: {
    marginBottom: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: theme.colors.surface,
  },
  brandRowOpen: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceHover,
  },
  brandTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.accentCyan,
  },
  modelBlock: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  modelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: theme.colors.bg,
  },
  modelRowOpen: {
    backgroundColor: theme.colors.surfaceHover,
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
  chevron: {
    fontSize: 14,
    color: theme.colors.accent,
    paddingLeft: 8,
  },
  rowPressed: { opacity: 0.85 },
});
