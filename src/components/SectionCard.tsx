import React from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { theme } from "../theme";
import type { GuideSection, PhotoRef, SectionText } from "../types/api";
import { ComparisonColumn } from "./ComparisonColumn";
import { ComparisonInsight } from "./ComparisonInsight";
import { GuideImage } from "./GuideImage";

interface Props {
  section: GuideSection;
  stepNumber?: number;
  totalSteps?: number;
  expanded?: boolean;
  onToggle?: () => void;
}

function columnHasContent(
  text: SectionText | null,
  photo: PhotoRef | null,
): boolean {
  return Boolean(text?.text || photo);
}

function resolveComparisonInsight(section: GuideSection): string | null {
  if (section.comparisonInsight?.trim()) {
    return section.comparisonInsight.trim();
  }

  const parts = [section.genuine?.text, section.counterfeit?.text].filter(
    Boolean,
  ) as string[];
  if (parts.length === 0) return null;

  const combined = parts.join(" ");
  return combined.length > 320 ? `${combined.slice(0, 317)}…` : combined;
}

function previewText(section: GuideSection): string | null {
  const source =
    section.comparisonInsight?.trim() ||
    section.genuine?.text ||
    section.counterfeit?.text ||
    section.content ||
    null;
  if (!source) return null;
  const line = source.split("\n").find((l) => l.trim().length > 0);
  if (!line) return null;
  return line.length > 90 ? `${line.slice(0, 87)}…` : line;
}

export function SectionCard({
  section,
  stepNumber,
  totalSteps,
  expanded = true,
  onToggle,
}: Props) {
  const { width } = useWindowDimensions();
  const sideBySide = width >= 700;

  const hasGenuine = columnHasContent(
    section.genuine,
    section.photos.genuine,
  );
  const hasCounterfeit = columnHasContent(
    section.counterfeit,
    section.photos.counterfeit,
  );
  const showComparison = hasGenuine || hasCounterfeit;
  const singleColumn = showComparison && hasGenuine !== hasCounterfeit;
  const twoColumns = hasGenuine && hasCounterfeit;
  const hasGenuinePhoto = Boolean(section.photos.genuine?.found);
  const hasCounterfeitPhoto = Boolean(section.photos.counterfeit?.found);
  const comparisonInsight = resolveComparisonInsight(section);
  const showInsightBetween =
    twoColumns &&
    hasGenuinePhoto &&
    hasCounterfeitPhoto &&
    Boolean(comparisonInsight);
  const preview = previewText(section);
  const collapsible = typeof onToggle === "function";

  const renderGenuineColumn = (paired: boolean, fullWidth: boolean) => (
    <ComparisonColumn
      variant="genuine"
      text={section.genuine}
      photo={section.photos.genuine}
      fullWidth={fullWidth}
      paired={paired}
      hideBodyText={showInsightBetween}
    />
  );

  const renderCounterfeitColumn = (paired: boolean, fullWidth: boolean) => (
    <ComparisonColumn
      variant="counterfeit"
      text={section.counterfeit}
      photo={section.photos.counterfeit}
      fullWidth={fullWidth}
      paired={paired}
      hideBodyText={showInsightBetween}
    />
  );

  return (
    <View style={[styles.card, expanded && styles.cardExpanded]}>
      <View style={styles.cardGlow} />

      <Pressable
        onPress={collapsible ? onToggle : undefined}
        disabled={!collapsible}
        style={({ pressed }) => [
          styles.header,
          collapsible && pressed && styles.headerPressed,
        ]}>
        <View style={styles.headerLeft}>
          {stepNumber != null ? (
            <View style={[styles.stepBadge, expanded && styles.stepBadgeActive]}>
              <Text style={[styles.stepText, expanded && styles.stepTextActive]}>
                {stepNumber}
              </Text>
            </View>
          ) : null}
          <View style={styles.headerText}>
            <Text style={styles.title}>{section.title}</Text>
            {!expanded && preview ? (
              <Text style={styles.preview} numberOfLines={2}>
                {preview}
              </Text>
            ) : null}
            {totalSteps != null && stepNumber != null ? (
              <Text style={styles.stepMeta}>
                Checkpoint {stepNumber} of {totalSteps}
              </Text>
            ) : null}
          </View>
        </View>
        {collapsible ? (
          <Text style={styles.chevron}>{expanded ? "▾" : "▸"}</Text>
        ) : null}
      </Pressable>

      {expanded ? (
        <View style={styles.body}>
          {section.content ? (
            <Text style={styles.content}>{section.content}</Text>
          ) : null}

          {showComparison ? (
            showInsightBetween ? (
              <View
                style={[
                  styles.row,
                  styles.rowPaired,
                  !sideBySide && styles.rowStacked,
                ]}>
                {renderGenuineColumn(sideBySide, false)}
                {sideBySide ? (
                  <>
                    <View style={styles.gap} />
                    <ComparisonInsight text={comparisonInsight!} inline />
                    <View style={styles.gap} />
                  </>
                ) : (
                  <ComparisonInsight text={comparisonInsight!} />
                )}
                {renderCounterfeitColumn(sideBySide, false)}
              </View>
            ) : (
              <View
                style={[
                  styles.row,
                  twoColumns && styles.rowPaired,
                  singleColumn && styles.rowSingle,
                  twoColumns && !sideBySide && styles.rowStacked,
                ]}>
                {hasGenuine ? renderGenuineColumn(twoColumns, singleColumn) : null}
                {twoColumns ? (
                  <View style={sideBySide ? styles.gap : styles.gapStacked} />
                ) : null}
                {hasCounterfeit
                  ? renderCounterfeitColumn(twoColumns, singleColumn)
                  : null}
              </View>
            )
          ) : null}

          {section.photos.reference ? (
            <View style={styles.reference}>
              <Text style={styles.refTitle}>Reference</Text>
              <GuideImage
                photo={section.photos.reference}
                label="Guide image"
                fullWidth
              />
            </View>
          ) : null}

          {section.notes.map((note, i) => (
            <Text key={i} style={styles.note}>
              {note}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardExpanded: {
    borderColor: theme.colors.borderBright,
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.accentCyan,
    opacity: 0.5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  headerPressed: { opacity: 0.85 },
  headerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  headerText: { flex: 1 },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.pillBg,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeActive: {
    borderColor: theme.colors.accentCyan,
    backgroundColor: "rgba(8, 145, 178, 0.12)",
  },
  stepText: {
    fontSize: 13,
    fontWeight: "800",
    color: theme.colors.textMuted,
  },
  stepTextActive: {
    color: theme.colors.accentCyan,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    lineHeight: 22,
  },
  preview: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  stepMeta: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 6,
    fontWeight: "600",
  },
  chevron: {
    fontSize: 16,
    color: theme.colors.accent,
    paddingLeft: 8,
  },
  body: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  content: {
    ...theme.font.body,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "flex-start" },
  rowPaired: { alignItems: "stretch" },
  rowSingle: { flexDirection: "column", alignItems: "stretch" },
  rowStacked: { flexDirection: "column", alignItems: "stretch" },
  gap: { width: 10 },
  gapStacked: { height: 10 },
  reference: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  refTitle: {
    ...theme.font.label,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  note: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 10,
    fontStyle: "italic",
    lineHeight: 18,
  },
});
