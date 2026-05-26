import React from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { theme } from "../theme";
import type { GuideSection, PhotoRef, SectionText } from "../types/api";
import { ComparisonColumn } from "./ComparisonColumn";
import { GuideImage } from "./GuideImage";

interface Props {
  section: GuideSection;
}

function columnHasContent(
  text: SectionText | null,
  photo: PhotoRef | null,
): boolean {
  return Boolean(text?.text || photo);
}

export function SectionCard({ section }: Props) {
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

  return (
    <View style={styles.card}>
      <View style={styles.cardGlow} />
      <Text style={styles.title}>{section.title}</Text>

      {section.content ? (
        <Text style={styles.content}>{section.content}</Text>
      ) : null}

      {showComparison ? (
        <View
          style={[
            styles.row,
            twoColumns && styles.rowPaired,
            singleColumn && styles.rowSingle,
            twoColumns && !sideBySide && styles.rowStacked,
          ]}>
          {hasGenuine ? (
            <ComparisonColumn
              variant="genuine"
              text={section.genuine}
              photo={section.photos.genuine}
              fullWidth={singleColumn}
              paired={twoColumns}
            />
          ) : null}
          {twoColumns ? (
            <View style={sideBySide ? styles.gap : styles.gapStacked} />
          ) : null}
          {hasCounterfeit ? (
            <ComparisonColumn
              variant="counterfeit"
              text={section.counterfeit}
              photo={section.photos.counterfeit}
              fullWidth={singleColumn}
              paired={twoColumns}
            />
          ) : null}
        </View>
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
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
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
  cardGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.accentCyan,
    opacity: 0.5,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 12,
    lineHeight: 22,
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
