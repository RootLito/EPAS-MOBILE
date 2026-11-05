// app/(tabs)/home.tsx
import { CustomCalendar } from "@/components/CustomCalendar";
import { EventCard } from "@/components/EventCard";
import { EventDetailModal } from "@/components/EventDetailModal";
import { getCalendarEvents } from "@/services/calendarService";
import { eventClassificationService } from "@/services/eventClassificationService";
import { Event } from "@/types";
import { useRouter } from "expo-router";
import { CalendarDays } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    Text,
    View,
} from "react-native";

const Home = () => {
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [highlightedDates, setHighlightedDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );

  // Modal State for tapping EventCards
  const [selectedCardEvent, setSelectedCardEvent] = useState<Event | null>(
    null,
  );
  const [cardModalVisible, setCardModalVisible] = useState<boolean>(false);

  const fetchEvents = useCallback(async () => {
    try {
      const { rawEvents, highlightedDates: dates } = await getCalendarEvents();
      // Enrich all events with real-time dynamic classification
      const enriched = eventClassificationService.enrichEvents(rawEvents || []);
      setEvents(enriched);
      setHighlightedDates(dates);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const handleOpenCardModal = (event: Event) => {
    setSelectedCardEvent(event);
    setCardModalVisible(true);
  };

  // Group events into dynamic buckets using eventClassificationService
  const classified = useMemo(() => {
    return eventClassificationService.groupEvents(events);
  }, [events]);

  const ongoingEvents = classified.ongoing;
  const upcomingEvents = classified.upcoming;

  return (
    <View className="flex-1 bg-white relative">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#395886" />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-6 pb-6"
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#395886"
              colors={["#395886"]}
            />
          }
        >
          {/* CustomCalendar self-manages highlighted dates */}
          <CustomCalendar
            selectedDate={selectedDate}
            onSelectDate={(date) => setSelectedDate(date)}
            highlightedDates={highlightedDates}
            events={events}
          />

          {/* Ongoing Events Section (Shows automatically if an event is happening today) */}
          {ongoingEvents.length > 0 && (
            <View className="mt-8">
              <View className="flex-row items-center gap-2 mb-4">
                <Text className="text-3xl font-bold text-brand-500">
                  Happening Now
                </Text>
              </View>

              {ongoingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onPress={handleOpenCardModal}
                />
              ))}
            </View>
          )}

          {/* Upcoming Events Header */}
          <View className="mt-8 mb-4">
            <Text className="text-3xl font-bold text-brand-500">
              Upcoming Events
            </Text>
          </View>

          {/* Events List or Appealing Empty State */}
          {upcomingEvents.length > 0 ? (
            upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={handleOpenCardModal}
              />
            ))
          ) : (
            <View className="bg-slate-50 border border-slate-200/80 rounded-3xl p-8 items-center justify-center my-2">
              {/* Badge Icon */}
              <View className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 items-center justify-center mb-3.5 shadow-sm">
                <CalendarDays size={28} color="#395886" />
              </View>

              <Text className="text-base font-bold text-brand-500 tracking-tight">
                No Upcoming Events
              </Text>

              <Text className="text-xs text-slate-400 text-center mt-1.5 max-w-[240px] leading-relaxed font-medium">
                There are no scheduled events coming up. Tap the floating +
                button to create one.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Modal for tapping EventCards */}
      <EventDetailModal
        visible={cardModalVisible}
        event={selectedCardEvent}
        onClose={() => setCardModalVisible(false)}
      />
    </View>
  );
};

export default Home;
