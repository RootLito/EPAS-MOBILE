import { useAuth } from "@/context/AuthContext";
import { Slot, usePathname, useRouter } from "expo-router";
import {
    Award,
    Calendar,
    Home,
    LogOut,
    Menu,
    UserCheck,
    Users,
} from "lucide-react-native";
import { useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { label: "Home", path: "/(admin)/home", icon: Home },
    { label: "Event", path: "/(admin)/event", icon: Calendar },
    { label: "Attendance", path: "/(admin)/attendance", icon: UserCheck },
    {
      label: "Certificate",
      path: "/(admin)/certificate",
      icon: Award,
    },
    { label: "Employees", path: "/(admin)/employee", icon: Users },
  ];

  const navigateTo = (path: string) => {
    setOpen(false);
    router.push(path as any);
  };

  const renderDrawerContent = () => (
    <SafeAreaView
      className="flex-1 bg-brand-500 justify-between py-6 px-5"
      edges={["top", "bottom"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-row items-center gap-3 mb-8 pt-2 border-b border-white/10 pb-4">
          <Image
            source={require("../../../assets/images/white.png")}
            style={{ width: 72, height: 72 }}
            resizeMode="contain"
          />
          <View>
            <Text className="text-white font-extrabold text-2xl tracking-wide">
              BFAR XI-EPAS
            </Text>
            <Text className="text-brand-200 font-medium">Admin Portal</Text>
          </View>
        </View>

        <View className="gap-2.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.path ||
              (item.path === "/(admin)/home" && pathname === "/(admin)");

            return (
              <TouchableOpacity
                key={item.path}
                onPress={() => navigateTo(item.path)}
                className={`flex-row items-center gap-3.5 px-4 py-3.5 rounded-2xl transition-all ${
                  isActive
                    ? "bg-white shadow-sm"
                    : "bg-transparent active:bg-white/10"
                }`}
              >
                <Icon size={20} color={isActive ? "#395886" : "#B1C9EF"} />
                <Text
                  className={` ${
                    isActive ? "text-brand-500 font-bold" : "text-brand-100"
                  }`}
                >
                  {item.label}
                </Text>
                {isActive && (
                  <View className="ml-auto w-2 h-2 rounded-full bg-accent-vibrant" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View className="gap-3">
        {/* Admin Profile Display (Non-touchable) */}
        <View className="flex-row items-center gap-3 p-3 rounded-2xl bg-white/10">
          <View className="w-11 h-11 rounded-full bg-white justify-center items-center p-1 shadow-sm overflow-hidden">
            <Image
              source={require("../../../assets/images/bfar.png")}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>

          <View className="flex-1 justify-center">
            <Text
              className="text-white font-bold text-base leading-tight"
              numberOfLines={1}
            >
              {user?.fullname || "Admin User"}
            </Text>
            <Text
              className="text-brand-200 text-xs font-medium mt-0.5"
              numberOfLines={1}
            >
              {user?.position || "Administrator"}
            </Text>
          </View>
        </View>

        {/* Logout Action */}
        <TouchableOpacity
          onPress={logout}
          className="flex-row items-center justify-center gap-2 py-3.5 rounded-xl bg-red-500/90 active:bg-red-600"
        >
          <LogOut size={18} color="#ffffff" />
          <Text className="text-white font-semibold text-sm">Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        drawerType="front"
        drawerPosition="left"
        drawerStyle={{
          backgroundColor: "#395886",
          width: 290,
          borderTopRightRadius: 36,
          borderBottomRightRadius: 36,
          overflow: "hidden",
        }}
        renderDrawerContent={renderDrawerContent}
      >
        <View className="flex-1">
          <SafeAreaView edges={["top"]}>
            <View className="flex-row items-center justify-between px-5 py-3">
              <TouchableOpacity
                onPress={() => setOpen(true)}
                className="w-14 h-14 rounded-full bg-brand-100 justify-center items-center"
              >
                <Menu size={28} color="#395886" />
              </TouchableOpacity>

              <Image
                source={require("../../../assets/images/bfar.png")}
                style={{ width: 72, height: 72 }}
                resizeMode="contain"
              />
            </View>
          </SafeAreaView>

          <View className="flex-1">
            <Slot />
          </View>
        </View>
      </Drawer>
    </GestureHandlerRootView>
  );
}
