import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  isExplanationSection,
  isInspectionSection,
} from "../lib/guideSections";
import { theme } from "../theme";
import type { Guide, GuideSection, UsageLimitPayload } from "../types/api";

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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());

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

  const explanationSections = useMemo(
    () => guide?.sections.filter((s) => isExplanationSection(s.title)) ?? [],
    [guide],
  );

  const inspectionSections = useMemo(
    () => guide?.sections.filter((s) => isInspectionSection(s.title)) ?? [],
    [guide],
  );

  useEffect(() => {
    if (inspectionSections.length > 0 && expandedId === null) {
      setExpandedId(inspectionSections[0].id);
      setVisitedIds(new Set([inspectionSections[0].id]));
    }
  }, [inspectionSections, expandedId]);

  const handleToggleSection = useCallback((section: GuideSection) => {
    setExpandedId((prev) => (prev === section.id ? null : section.id));
    setVisitedIds((prev) => {
      const next = new Set(prev);
      next.add(section.id);
      return next;
    });
  }, []);

  const progress =
    inspectionSections.length > 0
      ? visitedIds.size / inspectionSections.length
      : 0;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accentCyan} />
        <Text style={styles.loadingText}>Analyzing authentication guide…</Text>
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

  const watchLabel = [guide.brand, guide.model].filter(Boolean).join(" ") ||
    slug.replace(/_/g, " ");

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
        <View style={styles.assistantCard}>
          <View style={styles.assistantBadge}>
            <Text style={styles.assistantBadgeText}>AI ASSISTANT</Text>
          </View>
          <Text style={styles.assistantTitle}>
            Real vs fake inspection for {watchLabel}
          </Text>
          <Text style={styles.assistantBody}>
            Work through each checkpoint below. Compare genuine and counterfeit
            photos with the insight between them — pinch or double-tap any photo
            to zoom in on fine differences.
          </Text>
          {inspectionSections.length > 0 ? (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progress * 100}%` }]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {visitedIds.size} of {inspectionSections.length} checkpoints
                reviewed
              </Text>
            </View>
          ) : null}
        </View>

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

        {explanationSections.map((section) => (
          <SectionCard key={section.id} section={section} expanded />
        ))}

        {inspectionSections.length > 0 ? (
          <Text style={styles.sectionHeading}>Inspection checkpoints</Text>
        ) : null}

        {inspectionSections.map((section, index) => (
          <SectionCard
            key={section.id}
            section={section}
            stepNumber={index + 1}
            totalSteps={inspectionSections.length}
            expanded={expandedId === section.id}
            onToggle={() => handleToggleSection(section)}
          />
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
  assistantCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.borderBright,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.accentCyan,
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  assistantBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderBright,
    backgroundColor: "rgba(8, 145, 178, 0.1)",
    marginBottom: 10,
  },
  assistantBadgeText: {
    ...theme.font.label,
    color: theme.colors.accentCyan,
    fontSize: 10,
  },
  assistantTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.text,
    lineHeight: 24,
    marginBottom: 8,
  },
  assistantBody: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 21,
  },
  progressWrap: { marginTop: 14 },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.pillBg,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: theme.colors.accentCyan,
  },
  progressLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 8,
    fontWeight: "600",
  },
  sectionHeading: {
    ...theme.font.label,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
    marginTop: 4,
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
