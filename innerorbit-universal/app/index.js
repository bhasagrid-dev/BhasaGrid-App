/** Purpose: Root entry point handles platform-specific gating (Biometrics). Decoy/Stealth calculator completely removed. */
import React, { useEffect } from "react";
import { View } from "react-native";
import { isWeb } from "../utils/platform";
import { useRouter } from "expo-router";
import { BiometricLockScreen } from "../components/auth/BiometricLockScreen";
import { Logger } from "../lib/logger";

import { useAuth } from "../context/auth-context";
import { useAppTheme } from "../store/themeStore";
import { LoadingDots } from "../components/ui/loading-dots";

export default function AppContainer() {
    const { isBiometricLocked, authenticateBiometrics, user } = useAuth();
    const { theme: THEME } = useAppTheme();
    const router = useRouter();

    // Redirect unauthenticated users to login (all platforms).
    useEffect(() => {
        if (!user) {
            Logger.log("[Index] 🚪 User not authenticated → Redirecting to /login");
            router.replace("/login");
        } else {
            Logger.log("[Index] ✅ User authenticated → Redirecting to /home");
            router.replace("/home");
        }
    }, [user]);

    // MOBILE: Biometric Lock Challenge
    if (!isWeb && isBiometricLocked) {
        return <BiometricLockScreen onAuthenticate={authenticateBiometrics} />;
    }

    // MOBILE: Return null — _layout.js already shows the single preloader (logo + spinner).
    if (!isWeb) {
        return null;
    }

    // WEB: Brief transition state while useEffect redirect fires
    return (
        <View style={{ flex: 1, backgroundColor: THEME.background, alignItems: 'center', justifyContent: 'center' }}>
            <LoadingDots color={THEME.primary} size={8} gap={4} />
        </View>
    );
}
