import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { theme } from "../theme";

type Props = Omit<TextInputProps, "secureTextEntry"> & {
  containerStyle?: TextInputProps["style"];
};

export function PasswordInput({
  containerStyle,
  style,
  editable = true,
  ...rest
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={[styles.row, containerStyle]}>
      <TextInput
        {...rest}
        style={[styles.input, style]}
        secureTextEntry={!visible}
        editable={editable}
      />
      <Pressable
        style={styles.toggle}
        onPress={() => setVisible((v) => !v)}
        disabled={editable === false}
        accessibilityRole="button"
        accessibilityLabel={visible ? "Hide password" : "Show password"}>
        <Text style={[styles.toggleText, editable === false && styles.toggleDisabled]}>
          {visible ? "Hide" : "Show"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  toggle: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.accentCyan,
  },
  toggleDisabled: {
    color: theme.colors.textMuted,
  },
});
