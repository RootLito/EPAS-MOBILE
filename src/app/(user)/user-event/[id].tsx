import { useAuth } from "@/context/AuthContext";
import { attendanceService } from "@/services/attendanceService";
import { getEventById } from "@/services/eventService";
import { Event } from "@/types";
import { AttendanceScanType } from "@/types/attendance";
import { useCameraPermissions } from "expo-camera";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, FileText } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Components
import { AttendanceScanner } from "@/components/attendance/AttendanceScanner";
import { ScanModeSelector } from "@/components/attendance/ScanModeSelector";
import { EventCard } from "@/components/EventCard";

interface EventWithDetails extends Event {
  details?: string;
}

export default function EventDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Camera permissions & 3-step scanner state
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [step, setStep] = useState<"qr" | "selfie" | "preview">("qr");
  const [activeScanType, setActiveScanType] =
    useState<AttendanceScanType>("time_in");
  const [capturedPhoto, setCapturedPhoto] = useState<{
    uri: string;
    base64?: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        if (id) {
          const eventId = Array.isArray(id) ? id[0] : id;
          const data = await getEventById(eventId);
          setEvent(data as EventWithDetails);
        }
      } catch (error) {
        console.error("Failed to load event details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  // Step 1: Handle QR Scanned & Validate
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned || !event || !user?.id) return;
    setScanned(true);

    try {
      const scannedCode = data.includes("/check-in/")
        ? data.split("/check-in/").pop()
        : data;

      if (scannedCode !== event.qr_code && scannedCode !== event.id) {
        throw new Error(
          "Invalid QR code. Please scan the correct QR code for this event.",
        );
      }

      // Check if user already recorded attendance for this scan type
      const alreadyScanned = await attendanceService.checkUserScanExists(
        event.id,
        user.id,
        activeScanType,
      );

      if (alreadyScanned) {
        throw new Error(
          `You have already recorded ${activeScanType.replace("_", " ")} for this event.`,
        );
      }

      // QR valid! Proceed to front-camera selfie
      setStep("selfie");
    } catch (err: any) {
      Alert.alert(
        "QR Scan Error",
        err.message || "Failed to validate QR code.",
        [
          {
            text: "Try Again",
            onPress: () => setScanned(false),
          },
        ],
      );
    }
  };

  // Step 2: Handle Captured Selfie
  const handleTakeSelfie = (photo: { uri: string; base64?: string }) => {
    setCapturedPhoto(photo);
    setStep("preview");
  };

  // Step 3: Retake Selfie
  const handleRetake = () => {
    setCapturedPhoto(null);
    setStep("selfie");
  };

  // Cancel flow and go back to QR scanner
  const handleCancel = () => {
    setCapturedPhoto(null);
    setScanned(false);
    setStep("qr");
  };

  // Step 4: Confirm & Upload Attendance with Selfie
  const handleConfirm = async () => {
    if (!event || !user?.id || !capturedPhoto?.base64) return;
    setSubmitting(true);

    try {
      await attendanceService.recordAttendance({
        eventId: event.id,
        userId: user.id,
        scanType: activeScanType,
        base64Photo: capturedPhoto.base64,
      });

      const label = activeScanType.replace("_", " ").toUpperCase();
      Alert.alert(
        "Attendance Recorded! 🎉",
        `Successfully recorded ${label} with selfie for ${event.title}`,
        [
          {
            text: "Done",
            onPress: () => handleCancel(),
          },
        ],
      );
    } catch (err: any) {
      console.error("Submission failed:", err);
      Alert.alert(
        "Submission Failed",
        err.message || "Could not record attendance. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 bg-white items-center justify-center p-6">
        <Text className="text-slate-500 text-base mb-4">Event not found.</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="px-4 py-2 bg-brand-500 rounded-xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 px-6 bg-white"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* 1. Page Header */}
      <View className="flex-row items-center justify-between mb-4 mt-2">
        <Text className="text-3xl font-extrabold text-brand-500 tracking-tight">
          Event Details
        </Text>

        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center gap-1.5 px-4 py-1 rounded-full bg-brand-50 border border-brand-500"
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color="#395886" />
          <Text className="text-brand-500 font-semibold text-sm">Back</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Scan Mode Tabs (Time In / Break Out / Break In / Time Out) */}
      {step === "qr" && (
        <ScanModeSelector
          timelineType={event.timeline_type}
          activeScanType={activeScanType}
          onSelect={setActiveScanType}
        />
      )}

      {/* 3. Camera / Scanner (QR ➡️ Selfie ➡️ Preview) */}
      <AttendanceScanner
        step={step}
        activeScanType={activeScanType}
        permission={permission}
        scanned={scanned}
        submitting={submitting}
        capturedPhoto={capturedPhoto}
        onRequestPermission={requestPermission}
        onBarCodeScanned={handleBarCodeScanned}
        onTakeSelfie={handleTakeSelfie}
        onRetake={handleRetake}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />

      {/* 4. Event Overview Card (Reusing your EventCard component) */}
      <View className="mt-4">
        <EventCard event={event} />
      </View>

      {/* 5. Additional Event Description (if available) */}
      {event.details && (
        <View className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 shadow-xs mt-1">
          <View className="flex-row items-center gap-1.5 mb-2">
            <FileText size={16} color="#64748B" />
            <Text className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Description
            </Text>
          </View>
          <Text className="text-sm text-slate-600 font-medium leading-relaxed">
            {event.details}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
