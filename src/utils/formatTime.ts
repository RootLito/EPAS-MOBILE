/**
 * Formats a time string into a clean 12-hour readable time (e.g., "7:45 AM")
 */
export function formatScanTime(timeString: string): string {
    if (!timeString) return '';

    try {
        // If it's a full ISO string (e.g., "2026-06-06T07:45:00.000Z")
        if (timeString.includes('T') || timeString.includes('Z')) {
            const date = new Date(timeString);
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            });
        }

        // If it's a database TIME format (e.g., "07:45:00" or "07:45")
        const parts = timeString.split(':');
        if (parts.length >= 2) {
            let hours = parseInt(parts[0], 10);
            const minutes = parts[1];
            const ampm = hours >= 12 ? 'PM' : 'AM';

            hours = hours % 12;
            hours = hours ? hours : 12; // the hour '0' should be '12'

            return `${hours}:${minutes} ${ampm}`;
        }

        return timeString;
    } catch (error) {
        console.error('Error formatting time:', error);
        return timeString;
    }
}

/**
 * Formats a date string into a clean readable date (e.g., "June 6, 2026")
 */
export function formatScanDate(dateString: string): string {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });
    } catch (error) {
        return dateString;
    }
}

/**
 * Formats an event date string into a short readable date with day of the week (e.g., "Mon, Jun 6, 2026")
 */
export function formatEventDate(dateString: string): string {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch (error) {
        return dateString;
    }
}

/**
 * Formats an event date string into 2-digit hour/minute format (e.g., "07:45 AM")
 */
export function formatEventTime(dateString: string): string {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch (error) {
        return dateString;
    }
}