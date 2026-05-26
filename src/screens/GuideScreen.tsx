import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { fetchGuide, GuideLockedError } from "../api/client";
import { GuidePaywall } from "../components/GuidePaywall";
import { SectionCard } from "../components/SectionCard";
import { paymentsUiEnabled } from "../config";
import { theme } from "../theme";
import type { Guide, UsageLimitPayload } from "../types/api";

interface Props {
  slug: string;
  onBack: () => void;
  onOpenSubscription?: () => void;
}

export function GuideScreen({ slug, onBack, onOpenSubscription }: Props) {
  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState<UsageLimitPayload | null>(null);

  const loadGuide = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLocked(null);
    try {
      const res = await fetchGuide(slug);
      setGuide(res.guide);
    } catch (e) {
      if (e instanceof GuideLockedError) {
        setLocked(e.payload);
        setGuide(null);
      } else {
        setError(e instanceof Error ? e.message : "Failed to load guide");
        setGuide(null);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadGuide();
  }, [loadGuide]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accentCyan} />
        <Text style={styles.loadingText}>Loading guide…</Text>
      </View>
    );
  }

  if (locked) {
    return (
      <View style={styles.centered}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        {paymentsUiEnabled() ? (
          <GuidePaywall
            locked={locked}
            slug={slug}
            onSubscribed={loadGuide}
            onOpenSubscription={onOpenSubscription}
          />
        ) : (
          <Text style={styles.error}>
            This guide is not available in the MVP release.
          </Text>
        )}
      </View>
    );
  }

  if (error || !guide) {
    return (
      <View style={styles.centered}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.error}>{error ?? "Guide not found"}</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headerGlow} />
      <View style={styles.headerBar}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backBtn, pressed && styles.backPressed]}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {guide.brand ?? slug.replace(/_/g, " ")}
          </Text>
          {guide.model ? (
            <Text style={styles.headerSub} numberOfLines={2}>
              {guide.model}
            </Text>
          ) : null}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {guide.title ? (
          <View style={styles.refBadge}>
            <Text style={styles.refBadgeText}>{guide.title}</Text>
          </View>
        ) : null}

        {guide.missingImages && guide.missingImages.length > 0 ? (
          <View style={styles.warn}>
            <Text style={styles.warnText}>
              {guide.missingImages.length} image(s) missing in storage
            </Text>
          </View>
        ) : null}

        {guide.sections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: theme.colors.bg },
  headerGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: theme.colors.bgGlow,
    opacity: 0.9,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.glass,
    zIndex: 1,
  },
  headerTextWrap: { flex: 1, marginLeft: 8 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 12,
    color: theme.colors.accentGold,
    marginTop: 4,
    lineHeight: 17,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  backPressed: { opacity: 0.7 },
  backText: {
    color: theme.colors.accentCyan,
    fontSize: 20,
    fontWeight: "600",
  },
  scroll: { flex: 1 },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: theme.colors.bg,
  },
  loadingText: {
    marginTop: 12,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  refBadge: {
    alignSelf: "flex-start",
    marginBottom: theme.spacing.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(180, 83, 9, 0.35)",
    backgroundColor: "rgba(180, 83, 9, 0.08)",
  },
  refBadgeText: {
    fontSize: 12,
    color: theme.colors.accentGold,
    fontStyle: "italic",
  },
  warn: {
    backgroundColor: theme.colors.warningBg,
    borderWidth: 1,
    borderColor: "rgba(217, 119, 6, 0.25)",
    padding: 12,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },
  warnText: { fontSize: 12, color: theme.colors.warning },
  error: {
    color: theme.colors.error,
    textAlign: "center",
    marginTop: 16,
    fontSize: 14,
  },
});
