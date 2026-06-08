import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme";

interface Props {
  text: string;
  /** When true, render as a narrow center column between side-by-side photos. */
  inline?: boolean;
}

export function ComparisonInsight({ text, inline = false }: Props) {
  return (
    <View style={[styles.wrap, inline && styles.wrapInline]}>
      <View style={styles.accentBar} />
      <Text style={[styles.body, inline && styles.bodyInline]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderBright,
  },
  wrapInline: {
    flex: 1,
    marginVertical: 0,
    alignSelf: "stretch",
    justifyContent: "center",
    minWidth: 0,
  },
  accentBar: {
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.accentCyan,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: theme.colors.text,
    fontWeight: "500",
  },
  bodyInline: {
    fontSize: 13,
    lineHeight: 19,
  },
});
