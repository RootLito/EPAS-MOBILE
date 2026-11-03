// services/eventClassificationService.ts
import { Event } from "@/types/event";

export type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

export interface ClassifiedEvents {
    all: Event[];
    upcoming: Event[];
    ongoing: Event[];
    completed: Event[];
    cancelled: Event[];
}

export const eventClassificationService = {
    /**
     * 1. Calculate the dynamic status of a single event based on current date/time
     */
    classifyStatus(event: {
        start_date: string;
        end_date?: string | null;
        status?: string | null;
    }): EventStatus {
        // If the event was explicitly marked cancelled, respect that status
        if (event.status?.toLowerCase() === "cancelled") {
            return "cancelled";
        }

        const now = new Date();
        const startDate = new Date(event.start_date);

        // If no end_date, treat the end of the start_date's day as the end timestamp
        let endDate: Date;
        if (event.end_date) {
            endDate = new Date(event.end_date);
        } else {
            endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
        }

        // 1. Upcoming: Start date/time has not occurred yet
        if (now < startDate) {
            return "upcoming";
        }

        // 2. Ongoing: Currently between start date/time and end date/time
        if (now >= startDate && now <= endDate) {
            return "ongoing";
        }

        // 3. Completed: End date/time has already passed
        return "completed";
    },

    /**
     * 2. Categorize an array of events into grouped buckets
     */
    groupEvents(events: Event[]): ClassifiedEvents {
        const buckets: ClassifiedEvents = {
            all: [],
            upcoming: [],
            ongoing: [],
            completed: [],
            cancelled: [],
        };

        events.forEach((event) => {
            const computedStatus = this.classifyStatus(event);
            const enrichedEvent = { ...event, status: computedStatus };

            buckets.all.push(enrichedEvent);
            buckets[computedStatus].push(enrichedEvent);
        });

        return buckets;
    },

    /**
     * 3. Filter an array of events by selected filter tab ("All" | "Upcoming" | "Ongoing" | "Completed")
     */
    filterByTab(
        events: Event[],
        selectedTab: "All" | "Upcoming" | "Ongoing" | "Completed" | string
    ): Event[] {
        const tabLower = selectedTab.toLowerCase();
        if (tabLower === "all") {
            return events.map((e) => ({ ...e, status: this.classifyStatus(e) }));
        }

        return events
            .map((e) => ({ ...e, status: this.classifyStatus(e) }))
            .filter((e) => e.status.toLowerCase() === tabLower);
    },

    /**
     * 4. Enriches every event in a list with its accurate current status
     */
    enrichEvents(events: Event[]): Event[] {
        return events.map((event) => ({
            ...event,
            status: this.classifyStatus(event),
        }));
    },

    /**
     * 5. Helper check predicates
     */
    isUpcoming(event: Event): boolean {
        return this.classifyStatus(event) === "upcoming";
    },

    isOngoing(event: Event): boolean {
        return this.classifyStatus(event) === "ongoing";
    },

    isCompleted(event: Event): boolean {
        return this.classifyStatus(event) === "completed";
    },

    /**
     * 6. Status styling metadata (matches your web and mobile theme)
     */
    getStatusTheme(status: EventStatus | string) {
        const s = status?.toLowerCase();
        switch (s) {
            case "ongoing":
                return {
                    label: "Ongoing",
                    bg: "bg-amber-500/10",
                    border: "border-amber-500/20",
                    text: "text-amber-600",
                    dot: "bg-amber-500",
                };
            case "completed":
                return {
                    label: "Completed",
                    bg: "bg-emerald-500/10",
                    border: "border-emerald-500/20",
                    text: "text-emerald-600",
                    dot: "bg-emerald-500",
                };
            case "cancelled":
                return {
                    label: "Cancelled",
                    bg: "bg-rose-500/10",
                    border: "border-rose-500/20",
                    text: "text-rose-600",
                    dot: "bg-rose-500",
                };
            case "upcoming":
            default:
                return {
                    label: "Upcoming",
                    bg: "bg-primary/10",
                    border: "border-primary/20",
                    text: "text-primary",
                    dot: "bg-primary",
                };
        }
    },
};