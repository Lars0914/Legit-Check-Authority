import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  requestPasswordReset,
  resetPasswordWithCode,
} from "../api/client";
import { ScreenChrome } from "../components/ScreenChrome";
import { PasswordInput } from "../components/PasswordInput";
import { theme } from "../theme";

type Step = "email" | "code" | "password";

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

export function ForgotPasswordScreen({ onBack, onSuccess }: Props) {
  const [step, setStep] = useState<Step>("email");
  const [mail, setMail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const sendCode = async () => {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const res = await requestPasswordReset(mail);
      setInfo(res.message);
      setStep("code");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const goToPasswordStep = () => {
    setError(null);
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your email");
      return;
    }
    setStep("password");
  };

  const submitNewPassword = async () => {
    setLoading(true);
    setError(null);
    try {
      await resetPasswordWithCode(mail, code, password, confirmPassword);
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenChrome>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable onPress={onBack} style={styles.back}>
          <Text style={styles.backText}>← Back to sign in</Text>
        </Pressable>

        <Text style={styles.heading}>Reset password</Text>
        <Text style={styles.sub}>
          {step === "email" &&
            "Enter the email address on your account. Use the same address you sign in with (including Google sign-in)."}
          {step === "code" &&
            "Enter the 6-digit code from your email. Check spam if you do not see it within a few minutes."}
          {step === "password" && "Choose a new password."}
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, step !== "email" && styles.inputDisabled]}
            value={mail}
            onChangeText={setMail}
            placeholder="you@example.com"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={step === "email" && !loading}
          />
        </View>

        {step !== "email" ? (
          <View style={styles.field}>
            <Text style={styles.label}>6-digit code</Text>
            <TextInput
              style={[styles.input, step === "password" && styles.inputDisabled]}
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              editable={step === "code" && !loading}
            />
          </View>
        ) : null}

        {step === "password" ? (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>New password</Text>
              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="At least 8 characters"
                placeholderTextColor={theme.colors.textMuted}
                editable={!loading}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Confirm password</Text>
              <PasswordInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat password"
                placeholderTextColor={theme.colors.textMuted}
                editable={!loading}
              />
            </View>
          </>
        ) : null}

        {info ? <Text style={styles.info}>{info}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {step === "email" ? (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={sendCode}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send code</Text>
            )}
          </Pressable>
        ) : null}

        {step === "code" ? (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}
            onPress={goToPasswordStep}>
            <Text style={styles.buttonText}>Continue</Text>
          </Pressable>
        ) : null}

        {step === "password" ? (
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              loading && styles.buttonDisabled,
            ]}
            onPress={submitNewPassword}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Update password</Text>
            )}
          </Pressable>
        ) : null}

        {step === "code" ? (
          <Pressable
            style={styles.link}
            onPress={sendCode}
            disabled={loading}>
            <Text style={styles.linkText}>Resend code</Text>
          </Pressable>
        ) : null}
      </KeyboardAvoidingView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    justifyContent: "center",
    paddingBottom: theme.spacing.xl,
  },
  back: { marginBottom: theme.spacing.lg },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.accent,
  },
  heading: {
    ...theme.font.hero,
    color: theme.colors.text,
    marginBottom: 6,
  },
  sub: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  field: { marginBottom: theme.spacing.md },
  label: {
    ...theme.font.label,
    color: theme.colors.textMuted,
    marginBottom: 6,
    fontSize: 10,
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  inputDisabled: {
    backgroundColor: theme.colors.pillBg,
    color: theme.colors.textSecondary,
  },
  info: {
    color: theme.colors.accentCyan,
    marginBottom: theme.spacing.sm,
    fontSize: 14,
    lineHeight: 20,
  },
  error: {
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    fontSize: 14,
  },
  button: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: theme.spacing.sm,
  },
  buttonPressed: { opacity: 0.9 },
  buttonDisabled: { opacity: 0.7 },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  link: {
    alignItems: "center",
    marginTop: theme.spacing.md,
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.accentCyan,
  },
});
