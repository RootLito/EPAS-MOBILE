// app/(user)/events.tsx (or your user events screen file)
import { EventCard } from "@/components/EventCard";
import { QRCodeModal } from "@/components/QRCodeModal";
import { eventClassificationService } from "@/services/eventClassificationService";
import { getEvents } from "@/services/eventService";
import { Event } from "@/types";
import { useRouter } from "expo-router";
import { CalendarDays, Search, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const FILTER_TABS = ["All", "Upcoming", "Ongoing", "Completed"];

export default function UserEventIndex() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("All");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Full-screen Image State
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // QR Code Modal State
  const [selectedQrEvent, setSelectedQrEvent] = useState<Event | null>(null);

  const fetchEvents = async () => {
    try {
      const data = await getEvents();
      // Enrich events with real-time classification status
      const enriched = eventClassificationService.enrichEvents(data || []);
      setEvents(enriched);
    } catch (error: any) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  // Filter events by tab classification and search query
  const filteredEvents = useMemo(() => {
    const tabFiltered = eventClassificationService.filterByTab(
      events,
      selectedTab,
    );

    if (!searchQuery.trim()) return tabFiltered;

    const q = searchQuery.toLowerCase().trim();
    return tabFiltered.filter(
      (event) =>
        event.title.toLowerCase().includes(q) ||
        event.venue?.address?.toLowerCase().includes(q),
    );
  }, [events, selectedTab, searchQuery]);

  return (
    <View className="flex-1 bg-white relative">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#395886"
            colors={["#395886"]}
          />
        }
      >
        {/* Page Title */}
        <Text className="text-3xl font-extrabold text-brand-500 mb-4 tracking-tight mt-2">
          Events
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center bg-slate-100 px-4 py-3 rounded-2xl mb-4 border border-slate-200/50">
          <Search size={20} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search Event"
            placeholderTextColor="#94A3B8"
            className="flex-1 ml-3 text-base text-slate-800 font-medium p-0"
          />
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6 -mx-6 px-6"
        >
          <View className="flex-row gap-2 pr-6">
            {FILTER_TABS.map((tab) => {
              const isActive = selectedTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setSelectedTab(tab)}
                  className={`px-4 py-2 rounded-full border ${
                    isActive
                      ? "bg-brand-500 border-brand-500"
                      : "bg-white border-slate-200"
                  }`}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      isActive ? "text-white" : "text-slate-600"
                    }`}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Event List or Branded Empty State */}
        {loading ? (
          <View className="py-12 items-center justify-center">
            <ActivityIndicator size="large" color="#395886" />
          </View>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={(e) => router.push(`/(user)/event/${e.id}` as any)}
              onImagePress={(url) => setSelectedImageUrl(url)}
            />
          ))
        ) : (
          <View className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 items-center justify-center my-6">
            <View className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 items-center justify-center mb-3.5 shadow-sm">
              <CalendarDays size={28} color="#395886" />
            </View>
            <Text className="text-base font-bold text-brand-500 tracking-tight">
              No Events Found
            </Text>
            <Text className="text-xs text-slate-400 text-center mt-1.5 max-w-[240px] leading-relaxed font-medium">
              There are no events matching your filter or search query.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <QRCodeModal
        visible={!!selectedQrEvent}
        onClose={() => setSelectedQrEvent(null)}
        qrCode={selectedQrEvent?.qr_code || ""}
        qrImageUrl={selectedQrEvent?.qr_image_url}
        eventTitle={selectedQrEvent?.title}
      />

      {/* Full Screen Image Modal */}
      <Modal
        visible={!!selectedImageUrl}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImageUrl(null)}
      >
        <View className="flex-1 bg-black/90 justify-center items-center relative">
          <TouchableOpacity
            onPress={() => setSelectedImageUrl(null)}
            className="absolute top-12 right-6 z-50 w-10 h-10 rounded-full bg-white/20 justify-center items-center"
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {selectedImageUrl && (
            <Image
              source={{ uri: selectedImageUrl }}
              className="w-full h-5/6"
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}
