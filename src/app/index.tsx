import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";

export default function SplashScreen() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });

    scale.value = withSequence(
      withTiming(1, { duration: 600 }),
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 900 }),
          withTiming(1, { duration: 900 }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const handleNavigation = () => {
    if (!user) {
      router.replace("/login");
    } else if (user.role === "admin") {
      router.replace("/(admin)/home");
    } else {
      router.replace("/(user)/user-home");
    }
  };

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 400 }, (finished) => {
          if (finished) {
            runOnJS(handleNavigation)();
          }
        });
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isLoading, user]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.Image
        source={require("@/assets/images/android-icon-foreground.png")}
        style={[styles.logo, animatedStyle]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 160,
    height: 160,
  },
});
