import { authService } from "@/services/authService";
import { UserProfile } from "@/types/user";
import { Briefcase, Building, User } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Props {
  visible: boolean;
  code: string;
  onSuccess: (user: UserProfile) => void;
  onCancel: () => void;
}

export function RegisterModal({ visible, code, onSuccess, onCancel }: Props) {
  const [fullname, setFullname] = useState("");
  const [position, setPosition] = useState("");
  const [office, setOffice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    if (!fullname.trim() || !position.trim() || !office.trim()) {
      Alert.alert("Missing Fields", "Please complete all fields to register.");
      return;
    }

    try {
      setSubmitting(true);
      const newUser = await authService.registerClient({
        code,
        fullname,
        position,
        office,
      });
      onSuccess(newUser);
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/60 justify-center px-6">
        <View className="bg-white rounded-3xl p-6 shadow-xl">
          {/* Header */}
          <Text className="text-xl font-bold text-slate-800">
            New ID Detected
          </Text>
          <View className="flex-row items-center gap-1.5 mt-0.5 mb-5">
            <Text className="text-xs text-slate-400">Scanned ID:</Text>
            <Text className="text-xs font-semibold text-brand-500">{code}</Text>
          </View>

          {/* Form Fields with Labels */}
          <View className="gap-y-3.5 mb-6">
            {/* Full Name */}
            <View className="p-3 bg-brand-50 rounded-2xl border border-slate-100 flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-brand-100/70 items-center justify-center">
                <User size={16} color="#395886" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Full Name
                </Text>
                <TextInput
                  placeholder="e.g. Juan Dela Cruz"
                  placeholderTextColor="#94a3b8"
                  value={fullname}
                  onChangeText={setFullname}
                  className="font-bold text-slate-800 text-sm p-0 mt-0.5"
                />
              </View>
            </View>

            {/* Position */}
            <View className="p-3 bg-brand-50 rounded-2xl border border-slate-100 flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-brand-100/70 items-center justify-center">
                <Briefcase size={16} color="#395886" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Position / Designation
                </Text>
                <TextInput
                  placeholder="e.g. Computer Programmer I"
                  placeholderTextColor="#94a3b8"
                  value={position}
                  onChangeText={setPosition}
                  className="font-bold text-slate-800 text-sm p-0 mt-0.5"
                />
              </View>
            </View>

            {/* Office / Station */}
            <View className="p-3 bg-brand-50 rounded-2xl border border-slate-100 flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-brand-100/70 items-center justify-center">
                <Building size={16} color="#395886" />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Office / Station
                </Text>
                <TextInput
                  placeholder="e.g. RFIMU"
                  placeholderTextColor="#94a3b8"
                  value={office}
                  onChangeText={setOffice}
                  className="font-bold text-slate-800 text-sm p-0 mt-0.5"
                />
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={onCancel}
              disabled={submitting}
              className="flex-1 py-3.5 rounded-2xl bg-slate-100 items-center justify-center"
            >
              <Text className="text-slate-600 font-bold text-sm">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={submitting}
              className="flex-1 py-3.5 rounded-2xl bg-brand-500 items-center justify-center shadow-md shadow-brand-500/20"
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text className="text-white font-bold text-sm">Register</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
