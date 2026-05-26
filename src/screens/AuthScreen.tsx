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
import { useAuth } from "../auth/AuthContext";
import { APP_DISPLAY_NAME, AUTH_ENABLED } from "../config";
import { isGoogleSignInConfigured } from "../auth/googleSignIn";
import { ScreenChrome } from "../components/ScreenChrome";
import { theme } from "../theme";
import { ForgotPasswordScreen } from "./ForgotPasswordScreen";

type Mode = "signin" | "signup";

export function AuthScreen() {
  if (!AUTH_ENABLED) {
    return (
      <ScreenChrome>
        <View style={styles.disabledWrap}>
          <Text style={styles.heading}>{APP_DISPLAY_NAME}</Text>
          <Text style={styles.sub}>
            Sign-in and sign-up are not available in this release.
          </Text>
        </View>
      </ScreenChrome>
    );
  }

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const googleEnabled = isGoogleSignInConfigured();
  const [mode, setMode] = useState<Mode>("signin");
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetDone, setResetDone] = useState<string | null>(null);
  const [mail, setMail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (forgotOpen) {
    return (
      <ForgotPasswordScreen
        onBack={() => setForgotOpen(false)}
        onSuccess={() => {
          setForgotOpen(false);
          setMode("signin");
          setResetDone("Password updated. Sign in with your new password.");
        }}
      />
    );
  }

  const submitGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === "signin") {
        await signIn(mail, password);
      } else {
        await signUp(mail, password);
      }
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
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>AUTHENTICATION</Text>
          </View>
          <Text style={styles.heading}>{APP_DISPLAY_NAME}</Text>
          <Text style={styles.sub}>
            Sign in to search watch guides and verify genuine vs counterfeit.
          </Text>
        </View>

        <View style={styles.tabs}>
          <Pressable
            style={[styles.tab, mode === "signin" && styles.tabActive]}
            onPress={() => {
              setMode("signin");
              setError(null);
            }}>
            <Text
              style={[
                styles.tabText,
                mode === "signin" && styles.tabTextActive,
              ]}>
              Sign in
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, mode === "signup" && styles.tabActive]}
            onPress={() => {
              setMode("signup");
              setError(null);
            }}>
            <Text
              style={[
                styles.tabText,
                mode === "signup" && styles.tabTextActive,
              ]}>
              Sign up
            </Text>
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={mail}
            onChangeText={setMail}
            placeholder="you@example.com"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={mode === "signup" ? "At least 8 characters" : "Password"}
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            textContentType={mode === "signup" ? "newPassword" : "password"}
          />
        </View>

        {mode === "signin" ? (
          <Pressable
            style={styles.forgotLink}
            onPress={() => {
              setForgotOpen(true);
              setError(null);
              setResetDone(null);
            }}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        ) : null}

        {resetDone ? <Text style={styles.info}>{resetDone}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
            loading && styles.buttonDisabled,
          ]}
          onPress={submit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {mode === "signin" ? "Sign in" : "Create account"}
            </Text>
          )}
        </Pressable>

        {googleEnabled ? (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.googleButton,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={submitGoogle}
              disabled={loading}>
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </Pressable>
          </>
        ) : null}
      </KeyboardAvoidingView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  disabledWrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.spacing.md,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    justifyContent: "center",
    paddingBottom: theme.spacing.xl,
  },
  hero: { marginBottom: theme.spacing.lg },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderBright,
    backgroundColor: "rgba(8, 145, 178, 0.1)",
    marginBottom: theme.spacing.sm,
  },
  badgeText: {
    ...theme.font.label,
    color: theme.colors.accentCyan,
    fontSize: 10,
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
  tabs: {
    flexDirection: "row",
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.pillBg,
    borderRadius: theme.radius.md,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: theme.radius.sm,
  },
  tabActive: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textMuted,
  },
  tabTextActive: {
    color: theme.colors.accentCyan,
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
  forgotLink: {
    alignSelf: "flex-end",
    marginBottom: theme.spacing.md,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.accentCyan,
  },
  info: {
    color: theme.colors.genuine,
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
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 13,
    color: theme.colors.textMuted,
    fontWeight: "600",
  },
  googleButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  googleButtonText: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
});
