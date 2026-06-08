/**
 * Legit Check Authority — watch authentication guides
 */

import React, { useEffect, useState } from "react";
import { ActivityIndicator, StatusBar, StyleSheet, View } from "react-native";
import { setApiAuthToken } from "./src/api/client";
import { AuthProvider, useAuth } from "./src/auth/AuthContext";
import { AUTH_ENABLED, paymentsUiEnabled } from "./src/config";
import { configureGoogleSignIn } from "./src/auth/googleSignIn";
import { AuthScreen } from "./src/screens/AuthScreen";
import { ArchiveScreen } from "./src/screens/ArchiveScreen";
import { SubscriptionScreen } from "./src/screens/SubscriptionScreen";
import { theme } from "./src/theme";

function AppContent() {
  const { token, user, ready } = useAuth();
  const [subscriptionOpen, setSubscriptionOpen] = useState(false);

  useEffect(() => {
    setApiAuthToken(AUTH_ENABLED ? token : null);
  }, [token]);

  useEffect(() => {
    if (AUTH_ENABLED) {
      configureGoogleSignIn();
    }
  }, []);

  if (!ready) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.accentCyan} />
      </View>
    );
  }

  if (AUTH_ENABLED && (!token || !user)) {
    return <AuthScreen />;
  }

  const openSubscription = paymentsUiEnabled()
    ? () => setSubscriptionOpen(true)
    : undefined;

  return (
    <>
      {subscriptionOpen ? (
        <SubscriptionScreen onBack={() => setSubscriptionOpen(false)} />
      ) : (
        <ArchiveScreen onOpenSubscription={openSubscription} />
      )}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <View style={styles.root}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={theme.colors.bg}
          translucent
        />
        <AppContent />
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  centered: { justifyContent: "center", alignItems: "center" },
});

export default App;
