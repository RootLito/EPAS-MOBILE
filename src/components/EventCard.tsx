import { Event } from "@/types";
import {
    Calendar,
    Edit3,
    Image as ImageIcon,
    MapPin,
    Trash2,
} from "lucide-react-native";
import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ImageGalleryModal } from "./ImageGalleryModal";

interface EventCardProps {
  event: Event;
  onPress?: (event: Event) => void;
  onEdit?: (event: Event) => void;
  onDelete?: (event: Event) => void;
  onImagePress?: (url: string) => void;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> =
  {
    upcoming: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    ongoing: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    completed: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    cancelled: { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" },
  };

export function EventCard({
  event,
  onPress,
  onEdit,
  onDelete,
  onImagePress,
}: EventCardProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const startDate = new Date(event.start_date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const statusKey = event.status?.toLowerCase() || "upcoming";
  const badgeStyle = STATUS_STYLES[statusKey] || STATUS_STYLES.upcoming;

  const attachments = event.attachments || [];
  const imageUrls = attachments.map((att) => att.file_url).filter(Boolean);
  const primaryImage = imageUrls[0];
  const imageCount = imageUrls.length;

  const handleImageContainerPress = () => {
    if (imageUrls.length > 0) {
      setSelectedImage(primaryImage);
      setModalVisible(true);
    }
  };

  const handleSelectImage = (url: string) => {
    setSelectedImage(url);
    onImagePress?.(url);
  };

  return (
    <View>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress?.(event)}
        className="bg-slate-50 h-36 rounded-2xl mb-4 border border-slate-200/80 flex-row overflow-hidden"
      >
        {/* Left: Picture Container with dynamic full height matching */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleImageContainerPress}
          className="w-44 bg-slate-200 relative justify-center items-center"
        >
          {primaryImage ? (
            <Image
              source={{ uri: primaryImage }}
              className="w-full h-full min-h-[110px]"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-28 justify-center items-center">
              <ImageIcon size={24} color="#94A3B8" />
            </View>
          )}

          {/* Upper Left: Status Badge Overlay */}
          <View
            className={`absolute top-2 left-2 flex-row items-center gap-1 px-2 py-0.5 rounded-full ${badgeStyle.bg} shadow-xs z-10`}
          >
            <View className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
            <Text
              className={`text-[10px] font-bold capitalize ${badgeStyle.text}`}
            >
              {statusKey}
            </Text>
          </View>

          {/* Bottom Right: Picture Count Overlay */}
          {imageCount > 0 && (
            <View className="absolute bottom-2 right-2 bg-slate-900/70 px-2 py-0.5 rounded-md z-10">
              <Text className="text-[10px] text-white font-bold">
                {imageCount} {imageCount === 1 ? "pic" : "pics"}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Right: Details Container */}
        <View className="flex-1 p-4">
          {/* Top Section: Title & Actions */}
          <View className="flex-row justify-between items-start gap-2">
            <Text
              className="text-xl font-bold text-brand-500 tracking-tight flex-1"
              numberOfLines={2}
            >
              {event.title}
            </Text>

            {/* Action Buttons */}
            <View className="flex-row items-center gap-1.5">
              {onEdit && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onEdit(event)}
                  className="w-7 h-7 rounded-lg bg-brand-100 items-center justify-center"
                >
                  <Edit3 size={13} color="#64748B" />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => onDelete(event)}
                  className="w-7 h-7 rounded-lg bg-rose-100 items-center justify-center"
                >
                  <Trash2 size={13} color="#F43F5E" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Bottom Section: Venue & Date/Time Metadata */}
          <View className="gap-1 mt-2">
            {event.venue?.address && (
              <View className="flex-row items-center gap-1.5">
                <MapPin size={16} color="#94A3B8" />
                <Text
                  className="text-xs text-slate-500 font-medium flex-1"
                  numberOfLines={1}
                >
                  {event.venue.address}
                </Text>
              </View>
            )}

            <View className="flex-row items-center gap-1.5">
              <Calendar size={16} color="#94A3B8" />
              <Text className="text-xs text-slate-500 font-medium">
                {startDate}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Separated Image Gallery Modal */}
      <ImageGalleryModal
        visible={modalVisible}
        images={imageUrls}
        selectedImage={selectedImage}
        onSelectImage={handleSelectImage}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}
