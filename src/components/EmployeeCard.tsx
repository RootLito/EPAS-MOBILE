import { UserProfile } from "@/types/user";
import { Briefcase, Building, User } from "lucide-react-native";
import React from "react";
import { Image, Text, View } from "react-native";

interface EmployeeCardProps {
  item: UserProfile;
}

export const EmployeeCard: React.FC<EmployeeCardProps> = ({ item }) => {
  const firstName = item?.fullname?.split(" ")[0] || "User";
  const lastName = item?.fullname?.split(" ").slice(1).join(" ") || "";

  return (
    <View className="w-[48%] p-4 mb-3 bg-slate-50 rounded-2xl border border-slate-200/70 shadow-sm items-center">
      {/* Centered Avatar */}
      <View className="w-28 h-28 rounded-full bg-slate-100 items-center justify-center mb-3 overflow-hidden border border-slate-200">
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <User size={36} color="#94A3B8" />
        )}
      </View>

      {/* Styled Split Name */}
      <View className="items-center mb-2 w-full">
        <Text
          className="text-2xl font-bold text-slate-900 tracking-tight leading-tight text-center"
          numberOfLines={1}
        >
          {firstName}
        </Text>
        {lastName ? (
          <Text
            className="text-2xl font-light text-slate-400 tracking-tight leading-tight text-center"
            numberOfLines={1}
          >
            {lastName}
          </Text>
        ) : null}
      </View>

      {/* Position */}
      <View className="flex-row items-center w-full mb-1 px-1">
        <Briefcase size={14} color="#64748B" />
        <Text
          className="text-sm text-slate-600 font-medium ml-1.5 flex-1"
          numberOfLines={1}
        >
          {item.position}
        </Text>
      </View>

      {/* Office */}
      <View className="flex-row items-center w-full px-1">
        <Building size={14} color="#64748B" />
        <Text
          className="text-sm text-slate-500 font-medium ml-1.5 flex-1"
          numberOfLines={1}
        >
          {item.office}
        </Text>
      </View>
    </View>
  );
};
