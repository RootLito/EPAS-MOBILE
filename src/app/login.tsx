import { RegisterModal } from "@/components/RegisterModal";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Info } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const { login } = useAuth();

  // 1. Permission loading state
  if (!permission) {
    return (
      <View className="flex-1 bg-gray-100 justify-center items-center">
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  // 2. Permission denied state
  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center p-6">
        <Text className="text-center text-gray-700 mb-4 text-base">
          Camera permission is required to scan your ID barcode.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-sky-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanning) return;
    setScanning(true);

    try {
      const existingUser = await authService.getUserByCode(data);

      if (existingUser) {
        await login(existingUser);
      } else {
        setScannedCode(data);
        setShowRegister(true);
      }
    } catch (err: any) {
      Alert.alert("Scan Error", err.message);
      setScanning(false);
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50 justify-between items-center pt-6 pb-0 px-0"
      edges={["top", "left", "right"]}
    >
      {/* Top Header */}
      <View className="items-center mt-4 px-6">
        <Image
          source={require("../../assets/images/bfar.png")}
          style={{ width: 180, height: 180 }}
          resizeMode="contain"
          className="mb-3"
        />
        <Text className="text-5xl font-extrabold text-brand-500 tracking-wider">
          BFAR XI - EPAS
        </Text>
        <Text className="text-sm text-brand-400 tracking-wide mt-1">
          Event Planner and Attendance System
        </Text>
      </View>

      {/* Middle Camera Section */}
      <View className="w-full items-center px-6">
        <View className="w-full bg-brand-50 border border-brand-200 rounded-xl p-3 mb-5 flex-row items-center gap-2.5">
          <Info size={20} color="#395886" className="shrink-0" />
          <Text className="text-brand-500 text-sm leading-5 flex-1">
            Position the barcode inside the camera box below to automatically
            log in or register.
          </Text>
        </View>

        <View className="w-full h-64 rounded-2xl overflow-hidden border border-brand-200 bg-black relative shadow-md">
          <CameraView
            facing="back"
            style={StyleSheet.absoluteFill}
            onBarcodeScanned={scanning ? undefined : handleBarcodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr", "code128", "code39", "ean13"],
            }}
          />

          {scanning && !showRegister && (
            <View className="absolute inset-0 bg-black/60 justify-center items-center">
              <ActivityIndicator size="large" color="#ffffff" />
              <Text className="text-white text-xs font-medium mt-2">
                Processing ID...
              </Text>
            </View>
          )}
        </View>
        <Text className="text-brand-500 text-sm mt-12">
          Developed by RFIMU | BFAR XI © 2026
        </Text>
      </View>

      <View className="w-full relative items-center justify-end">
        <Image
          source={require("../../assets/images/back.png")}
          className="w-full h-40"
          resizeMode="cover"
        />
      </View>

      {scannedCode && (
        <RegisterModal
          visible={showRegister}
          code={scannedCode}
          onSuccess={async (newUser) => {
            setShowRegister(false);
            await login(newUser);
          }}
          onCancel={() => {
            setShowRegister(false);
            setScannedCode(null);
            setScanning(false);
          }}
        />
      )}
    </SafeAreaView>
  );
}
