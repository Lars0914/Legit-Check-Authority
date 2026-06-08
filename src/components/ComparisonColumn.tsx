import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";
import type { PhotoRef, SectionText } from "../types/api";
import { GuideImage } from "./GuideImage";

interface Props {
  variant: "genuine" | "counterfeit";
  text: SectionText | null;
  photo: PhotoRef | null;
  fullWidth?: boolean;
  paired?: boolean;
  /** Hide body text when a shared comparison insight is shown elsewhere. */
  hideBodyText?: boolean;
}

const variants = {
  genuine: {
    title: "Genuine",
    accent: theme.colors.genuine,
    bg: theme.colors.genuineDim,
    border: theme.colors.genuineBorder,
  },
  counterfeit: {
    title: "Counterfeit",
    accent: theme.colors.fake,
    bg: theme.colors.fakeDim,
    border: theme.colors.fakeBorder,
  },
};

export function ComparisonColumn({
  variant,
  text,
  photo,
  fullWidth = false,
  paired = false,
  hideBodyText = false,
}: Props) {
  const v = variants[variant];

  if (!text?.text && !photo) {
    return null;
  }

  return (
    <View
      style={[
        styles.column,
        paired && styles.columnPaired,
        fullWidth && styles.columnFullWidth,
        { backgroundColor: v.bg, borderColor: v.border },
      ]}>
      <View style={[styles.labelPill, { borderColor: v.border }]}>
        <View style={[styles.labelDot, { backgroundColor: v.accent }]} />
        <Text style={[styles.labelText, { color: v.accent }]}>{v.title}</Text>
      </View>
      {text?.text && !hideBodyText ? (
        <Text style={styles.body}>{text.text}</Text>
      ) : null}
      {photo ? (
        <View style={styles.photoSlot}>
          <GuideImage
            photo={photo}
            label={variant === "genuine" ? "Reference" : "Comparison"}
            fullWidth={fullWidth}
            paired={paired}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    flex: 1,
    borderWidth: 1,
    borderRadius: theme.radius.md,
    padding: 12,
    minWidth: 0,
  },
  columnPaired: {
    flex: 1,
    alignSelf: "stretch",
  },
  columnFullWidth: {
    flex: 0,
    width: "100%",
    alignSelf: "stretch",
  },
  labelPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
    backgroundColor: theme.colors.pillBg,
  },
  labelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  labelText: {
    ...theme.font.label,
    fontSize: 10,
  },
  body: {
    ...theme.font.body,
    color: theme.colors.text,
  },
  photoSlot: { marginTop: 10 },
});
