import { useStripe } from "@stripe/stripe-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  confirmSubscription,
  createSubscriptionCheckout,
  fetchSubscription,
} from "../api/client";
import { APP_DISPLAY_NAME } from "../config";
import { ScreenChrome } from "../components/ScreenChrome";
import { theme } from "../theme";
import type { SubscriptionInfo } from "../types/api";

function formatPrice(cents: number, currency: string): string {
  const amount = (cents / 100).toFixed(0);
  return currency.toLowerCase() === "usd"
    ? `$${amount}`
    : `${amount} ${currency.toUpperCase()}`;
}

interface Props {
  onBack: () => void;
}

export function SubscriptionScreen({ onBack }: Props) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null,
  );
  const [proPriceCents, setProPriceCents] = useState(4900);
  const [currency, setCurrency] = useState("usd");
  const [freeLimit, setFreeLimit] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSubscription();
      setSubscription(data.subscription);
      setProPriceCents(data.proPriceCents);
      setCurrency(data.currency);
      setFreeLimit(data.freeMonthlyLimit);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load subscription");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      if (initError) throw new Error(initError.message);
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        if (presentError.code === "Canceled") return;
        throw new Error(presentError.message);
      }
      await confirmSubscription(subscriptionId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  const priceLabel = formatPrice(proPriceCents, currency);

  return (
    <ScreenChrome>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <Pressable onPress={onBack} hitSlop={8} style={styles.back}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <Text style={styles.heading}>Subscription</Text>

        {loading ? (
          <ActivityIndicator
            color={theme.colors.accentCyan}
            style={styles.loader}
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {subscription ? (
          <View style={styles.statusCard}>
            <Text style={styles.planLabel}>
              Current plan:{" "}
              <Text style={styles.planValue}>
                {subscription.active ? "Pro" : "Free"}
              </Text>
            </Text>
            {subscription.active && subscription.periodEnd ? (
              <Text style={styles.meta}>
                Renews / ends:{" "}
                {new Date(subscription.periodEnd).toLocaleDateString()}
              </Text>
            ) : (
              <Text style={styles.meta}>
                Free: {freeLimit} search or guide view per month (
                {subscription.periodKey}). Used: {subscription.usageCount}/
                {subscription.usageLimit ?? freeLimit}.
              </Text>
            )}
          </View>
        ) : null}

        <View style={styles.planCard}>
          <Text style={styles.planName}>Free</Text>
          <Text style={styles.planPrice}>$0</Text>
          <Text style={styles.planDetail}>
            One search (2+ characters) or one guide view per calendar month.
          </Text>
        </View>

        <View style={[styles.planCard, styles.planCardPro]}>
          <Text style={styles.planName}>Pro</Text>
          <Text style={styles.planPrice}>{priceLabel}/month</Text>
          <Text style={styles.planDetail}>
            Unlimited premium guide searches and views for the billing month.
          </Text>
          {!subscription?.active ? (
            <Pressable
              style={[styles.subscribeBtn, busy && styles.btnDisabled]}
              onPress={subscribe}
              disabled={busy}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.subscribeBtnText}>
                  Subscribe with card
                </Text>
              )}
            </Pressable>
          ) : (
            <Text style={styles.activeNote}>You’re on Pro — enjoy unlimited access.</Text>
          )}
        </View>
      </ScrollView>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  back: { marginBottom: theme.spacing.md },
  backText: {
    color: theme.colors.accentCyan,
    fontSize: 16,
    fontWeight: "600",
  },
  heading: {
    ...theme.font.hero,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  loader: { marginVertical: 24 },
  error: {
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    fontSize: 14,
  },
  statusCard: {
    padding: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderBright,
    backgroundColor: "rgba(8, 145, 178, 0.08)",
    marginBottom: theme.spacing.lg,
  },
  planLabel: { fontSize: 15, color: theme.colors.text },
  planValue: { fontWeight: "800", color: theme.colors.accentCyan },
  meta: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  planCard: {
    padding: 16,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.spacing.md,
  },
  planCardPro: {
    borderColor: "rgba(180, 83, 9, 0.35)",
  },
  planName: {
    fontSize: 18,
    fontWeight: "800",
    color: theme.colors.text,
  },
  planPrice: {
    fontSize: 22,
    fontWeight: "800",
    color: theme.colors.accentGold,
    marginTop: 4,
  },
  planDetail: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 10,
    lineHeight: 20,
  },
  subscribeBtn: {
    marginTop: 16,
    backgroundColor: theme.colors.accentCyan,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.7 },
  subscribeBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  activeNote: {
    marginTop: 14,
    fontSize: 14,
    color: theme.colors.accentCyan,
    fontWeight: "600",
  },
});
