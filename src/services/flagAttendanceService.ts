// src/services/flagAttendanceService.ts
import { supabase } from '@/lib/supabase';
import { CreateFlagAttendanceDTO, FlagAttendance } from '@/types/flagAttendance';
import { UserProfile } from '@/types/user';

export const flagAttendanceService = {
    // Fetch all attendance records (with user details)
    async getAllAttendance(): Promise<FlagAttendance[]> {
        const { data, error } = await supabase
            .from('flag_attendance')
            .select(`
        *,
        user:users(*)
      `)
            .order('scan_date', { ascending: false })
            .order('scan_time', { ascending: false });

        if (error) {
            console.error('Error fetching flag attendance:', error.message);
            throw error;
        }

        return data || [];
    },

    // Fetch all users combined with attendance (marks un-scanned users as Absent)
    async getUsersWithAttendance(ceremonyType?: string, targetDate?: string): Promise<FlagAttendance[]> {
        // 1. Fetch all users
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .order('fullname', { ascending: true });

        if (userError) {
            console.error('Error fetching users:', userError.message);
            throw userError;
        }

        // 2. Fetch attendance records
        let query = supabase
            .from('flag_attendance')
            .select('*, user:users(*)');

        if (targetDate) {
            query = query.eq('scan_date', targetDate);
        }
        if (ceremonyType && ceremonyType !== 'All Ceremonies') {
            query = query.eq('ceremony_type', ceremonyType);
        }

        const { data: attendanceRecords, error: attError } = await query;

        if (attError) {
            console.error('Error fetching attendance for merge:', attError.message);
            throw attError;
        }

        // 3. Map users to attendance or create an "Absent" placeholder record
        const attendanceMap = new Map();
        (attendanceRecords || []).forEach((record) => {
            // Key by client_id and ceremony_type/date to handle multiple ceremonies uniquely
            attendanceMap.set(`${record.client_id}_${record.ceremony_type}_${record.scan_date}`, record);
        });

        const activeDate = targetDate || new Date().toISOString().split('T')[0];
        const activeCeremony = ceremonyType && ceremonyType !== 'All Ceremonies' ? ceremonyType : 'Flag Raising';

        const completeList: FlagAttendance[] = (users || []).map((user: UserProfile) => {
            const key = `${user.id}_${activeCeremony}_${activeDate}`;
            const existingRecord = attendanceMap.get(key);

            if (existingRecord) {
                return existingRecord;
            }

            // If user has NO attendance record, mark as Absent
            return {
                id: `absent-${user.id}-${activeDate}`,
                client_id: user.id,
                code: user.code,
                ceremony_type: activeCeremony,
                status: 'Absent',
                scan_date: activeDate,
                scan_time: '',
                created_at: '',
                user: user,
            };
        });

        return completeList;
    },

    // Log a new attendance scan
    async recordAttendance(dto: CreateFlagAttendanceDTO): Promise<FlagAttendance> {
        const today = new Date().toISOString().split('T')[0];
        const currentTime = new Date().toTimeString().split(' ')[0];

        const { data, error } = await supabase
            .from('flag_attendance')
            .insert([
                {
                    client_id: dto.client_id,
                    code: dto.code,
                    ceremony_type: dto.ceremony_type,
                    status: dto.status,
                    scan_date: dto.scan_date || today,
                    scan_time: dto.scan_time || currentTime,
                },
            ])
            .select(`
        *,
        user:users(*)
      `)
            .single();

        if (error) {
            console.error('Error recording flag attendance:', error.message);
            throw error;
        }

        return data;
    },

    // Check if a user has already scanned for a specific ceremony on a specific date
    async checkExistingAttendance(clientId: string, ceremonyType: string, date: string): Promise<FlagAttendance | null> {
        const { data, error } = await supabase
            .from('flag_attendance')
            .select('*')
            .eq('client_id', clientId)
            .eq('ceremony_type', ceremonyType)
            .eq('scan_date', date)
            .maybeSingle();

        if (error) {
            console.error('Error checking existing attendance:', error.message);
            throw error;
        }

        return data;
    },
};