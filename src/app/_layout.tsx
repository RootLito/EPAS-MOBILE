import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Slot, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import {
    configureReanimatedLogger,
    ReanimatedLogLevel,
} from "react-native-reanimated";
import "../global.css";

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const rawSegments = useSegments();
  const segments = rawSegments as string[];
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (segments.length === 0) return;

    const inAuthGroup = segments[0] === "login";
    const inAdminGroup = segments[0] === "(admin)";
    const inUserGroup = segments[0] === "(user)";

    if (!user) {
      if (!inAuthGroup) {
        router.replace("/login");
      }
    } else if (user.role === "admin") {
      if (!inAdminGroup) {
        router.replace("/(admin)/home");
      }
    } else if (user.role === "client") {
      if (!inUserGroup) {
        router.replace("/(user)/user-home");
      }
    }
  }, [user, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <RootLayoutNav />
    </AuthProvider>
  );
}
