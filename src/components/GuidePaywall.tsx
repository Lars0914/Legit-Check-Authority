import { useStripe } from "../payments/useStripe";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  confirmSubscription,
  createSubscriptionCheckout,
} from "../api/client";
import { APP_DISPLAY_NAME } from "../config";
import { theme } from "../theme";
import type { UsageLimitPayload } from "../types/api";

function formatPrice(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(0);
  return currency.toLowerCase() === "usd" ? `$${amount}` : `${amount} ${currency.toUpperCase()}`;
}

interface Props {
  locked: UsageLimitPayload;
  slug?: string;
  onSubscribed: () => void;
  onOpenSubscription?: () => void;
}

export function GuidePaywall({
  locked,
  slug,
  onSubscribed,
  onOpenSubscription,
}: Props) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priceLabel = formatPrice(locked.upgradePriceCents, locked.currency);

  const subscribe = async () => {
    setBusy(true);
    setError(null);
    try {
      const { clientSecret, subscriptionId } =
        await createSubscriptionCheckout();
      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: APP_DISPLAY_NAME,
        paymentIntentClientSecret: clientSecret,
      });
      if (initError) {
        throw new Error(initError.message);
      }
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code === "Canceled") return;
        throw new Error(presentError.message);
      }
      await confirmSubscription(subscriptionId);
      onSubscribed();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Premium guides</Text>
      <Text style={styles.body}>
        {slug
          ? `You’ve used your free access for ${locked.periodKey}.`
          : `You’ve used your free monthly search or view for ${locked.periodKey}.`}
      </Text>
      <Text style={styles.body}>
        Upgrade to <Text style={styles.emphasis}>Pro</Text> ({priceLabel}/month)
        for unlimited searches and guide views.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable
        style={[styles.primaryBtn, busy && styles.btnDisabled]}
        onPress={subscribe}
        disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.primaryBtnText}>Subscribe — {priceLabel}/mo</Text>
        )}
      </Pressable>
      {onOpenSubscription ? (
        <Pressable onPress={onOpenSubscription} style={styles.linkBtn}>
          <Text style={styles.linkText}>View plan details</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    maxWidth: 360,
    padding: 20,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 21,
    marginBottom: 10,
  },
  emphasis: {
    fontWeight: "700",
    color: theme.colors.accentGold,
  },
  error: {
    color: theme.colors.error,
    fontSize: 13,
    marginBottom: 8,
  },
  primaryBtn: {
    marginTop: 8,
    backgroundColor: theme.colors.accentCyan,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  linkBtn: { marginTop: 14, alignItems: "center" },
  linkText: {
    color: theme.colors.accentCyan,
    fontSize: 14,
    fontWeight: "600",
  },
});
