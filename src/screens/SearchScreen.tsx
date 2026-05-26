import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  checkApiHealth,
  searchGuides,
  UsageLimitError,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";
import {
  API_BASE_URL,
  APP_DISPLAY_NAME,
  AUTH_ENABLED,
  paymentsUiEnabled,
} from "../config";
import { ScreenChrome } from "../components/ScreenChrome";
import { theme } from "../theme";
import type { SearchResult, SubscriptionInfo } from "../types/api";

interface Props {
  onSelectGuide: (slug: string) => void;
  onOpenSubscription?: () => void;
}

export function SearchScreen({ onSelectGuide, onOpenSubscription }: Props) {
  const auth = useAuth();
  const user = AUTH_ENABLED ? auth.user : null;
  const signOut = AUTH_ENABLED ? auth.signOut : async () => {};
  const showPayments = paymentsUiEnabled();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [focused, setFocused] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null,
  );
  const [usageLimit, setUsageLimit] = useState<string | null>(null);

  useEffect(() => {
    checkApiHealth().then(setApiOk);
  }, []);

  const runSearch = useCallback(async (text: string) => {
    setLoading(true);
    setError(null);
    setUsageLimit(null);
    try {
      const data = await searchGuides(text);
      setResults(data.results);
      if (data.subscription) {
        setSubscription(data.subscription);
      }
    } catch (e) {
      setResults([]);
      if (e instanceof UsageLimitError) {
        setUsageLimit(e.payload.error);
        setSubscription({
          plan: e.payload.plan,
          status: null,
          active: false,
          periodEnd: null,
          usageCount: e.payload.usageCount,
          usageLimit: e.payload.usageLimit,
          periodKey: e.payload.periodKey,
          unlimited: false,
          lastViewedSlug: null,
        });
      } else {
        const message = e instanceof Error ? e.message : "Search failed";
        setError(
          !AUTH_ENABLED && message === "Sign in required"
            ? "Server requires sign-in. On Vercel set AUTH_ENABLED=false and redeploy the backend."
            : message,
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length === 0) {
        runSearch("");
        return;
      }
      if (query.trim().length >= 2) {
        runSearch(query);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  return (
    <ScreenChrome>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>AUTHENTICATION</Text>
            </View>
            {AUTH_ENABLED ? (
              <View style={styles.heroActions}>
                {showPayments && onOpenSubscription ? (
                  <Pressable onPress={onOpenSubscription} hitSlop={8}>
                    <Text style={styles.paymentLink}>Plan</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => signOut()} hitSlop={8}>
                  <Text style={styles.signOut}>Sign out</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
          <Text style={styles.heading}>{APP_DISPLAY_NAME}</Text>
          <Text style={styles.sub}>
            {AUTH_ENABLED && user
              ? `Signed in as ${user.mail}. Search guides below.`
              : "Browse watch authentication guides below."}
          </Text>
          {AUTH_ENABLED && showPayments && subscription ? (
            <Text style={styles.planHint}>
              {subscription.active
                ? "Pro — unlimited access this billing period."
                : `Free plan — ${subscription.usageCount}/${subscription.usageLimit ?? 1} used this month (${subscription.periodKey}). One search or view per month.`}
            </Text>
          ) : null}
        </View>

        {showPayments && usageLimit ? (
          <View style={styles.limitBanner}>
            <Text style={styles.limitText}>{usageLimit}</Text>
            {onOpenSubscription ? (
              <Pressable onPress={onOpenSubscription}>
                <Text style={styles.limitLink}>Upgrade to Pro →</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {apiOk === false ? (
          <View style={styles.banner}>
            <Text style={styles.bannerText}>
              Cannot reach API. Start backend: npm run dev
            </Text>
            <Text style={styles.bannerUrl}>{API_BASE_URL}</Text>
          </View>
        ) : null}

        <View
          style={[
            styles.searchWrap,
            focused && styles.searchWrapFocused,
          ]}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.input}
            placeholder="Search brand, model, guide…"
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => runSearch(query)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
        </View>

        {loading ? (
          <ActivityIndicator
            style={styles.loader}
            color={theme.colors.accentCyan}
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Text style={styles.sectionLabel}>Guides</Text>

        <FlatList
          data={results}
          keyExtractor={(item) => item.slug}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && !error ? (
              <Text style={styles.empty}>No guides match your search.</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.item,
                pressed && styles.itemPressed,
              ]}
              onPress={() => onSelectGuide(item.slug)}>
              <View style={styles.itemAccent} />
              <View style={styles.itemBody}>
                <View style={styles.itemTitleRow}>
                  <Text style={styles.itemTitle}>
                    {item.brand ?? item.slug.replace(/_/g, " ")}
                  </Text>
                  {item.premium ? (
                    <View
                      style={[
                        styles.premiumBadge,
                        item.accessible !== false && styles.premiumOwned,
                      ]}>
                      <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                    </View>
                  ) : null}
                </View>
                {item.model ? (
                  <Text style={styles.itemModel}>{item.model}</Text>
                ) : null}
                {item.title ? (
                  <Text style={styles.itemMeta}>{item.title}</Text>
                ) : null}
                <Text style={styles.itemSlug}>{item.slug}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          )}
        />
      </View>
    </ScreenChrome>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  hero: { marginBottom: theme.spacing.lg },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  paymentLink: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.accentCyan,
  },
  signOut: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.accent,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderBright,
    backgroundColor: "rgba(8, 145, 178, 0.1)",
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
  planHint: {
    fontSize: 13,
    color: theme.colors.accentGold,
    marginTop: 10,
    lineHeight: 18,
  },
  limitBanner: {
    backgroundColor: "rgba(180, 83, 9, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(180, 83, 9, 0.35)",
    padding: 12,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },
  limitText: { fontSize: 13, color: theme.colors.text, lineHeight: 18 },
  limitLink: {
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.accentCyan,
    marginTop: 8,
  },
  banner: {
    backgroundColor: theme.colors.warningBg,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.35)",
    padding: 12,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
  },
  bannerText: { fontSize: 13, color: theme.colors.warning, lineHeight: 18 },
  bannerUrl: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    marginBottom: theme.spacing.md,
  },
  searchWrapFocused: {
    borderColor: theme.colors.accentCyan,
    backgroundColor: theme.colors.surfaceHover,
  },
  searchIcon: {
    fontSize: 18,
    color: theme.colors.accentCyan,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  loader: { marginVertical: 12 },
  error: { color: theme.colors.error, marginBottom: 8 },
  sectionLabel: {
    ...theme.font.label,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.sm,
  },
  list: { paddingBottom: theme.spacing.xl },
  empty: {
    textAlign: "center",
    color: theme.colors.textMuted,
    marginTop: 24,
    fontSize: 14,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    shadowColor: "#6366F1",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemPressed: {
    backgroundColor: theme.colors.surfaceHover,
    borderColor: theme.colors.borderBright,
  },
  itemAccent: {
    width: 3,
    alignSelf: "stretch",
    backgroundColor: theme.colors.accent,
  },
  itemBody: {
    flex: 1,
    padding: 14,
  },
  itemTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: theme.colors.accentCyan,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(180, 83, 9, 0.45)",
    backgroundColor: "rgba(180, 83, 9, 0.12)",
  },
  premiumOwned: {
    borderColor: "rgba(8, 145, 178, 0.45)",
    backgroundColor: "rgba(8, 145, 178, 0.12)",
  },
  premiumBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: theme.colors.accentGold,
  },
  itemModel: {
    fontSize: 14,
    color: theme.colors.text,
    marginTop: 4,
    lineHeight: 20,
  },
  itemMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  itemSlug: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  chevron: {
    fontSize: 22,
    color: theme.colors.accent,
    paddingRight: 14,
    fontWeight: "300",
  },
});
