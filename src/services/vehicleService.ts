import { supabase } from '../lib/supabase';
import type { VehicleRecord, VehicleRecordInput } from '../types/database';

type VehiclePlateRow = { vehicle_plate: string | null };

export const vehicleService = {
  async listUnavailableVehiclePlates(): Promise<string[]> {
    const [{ data: pickupRecords, error: pickupError }, { data: operationalMovements, error: operationalError }] =
      await Promise.all([
        supabase
          .from('vehicle_records')
          .select('vehicle_plate')
          .eq('status', 'Em uso'),
        supabase
          .from('operational_movements')
          .select('vehicle_plate')
          .eq('status', 'Em aberto'),
      ]);

    if (pickupError) throw pickupError;
    if (operationalError) throw operationalError;

    return Array.from(
      new Set(
        ([...(pickupRecords || []), ...(operationalMovements || [])] as VehiclePlateRow[])
          .map((record) => record.vehicle_plate?.trim().toUpperCase())
          .filter((plate): plate is string => Boolean(plate))
      )
    );
  },

  async createRecord(data: VehicleRecordInput): Promise<VehicleRecord> {
    const { data: record, error } = await supabase
      .from('vehicle_records')
      .insert(data as never)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return record as unknown as VehicleRecord;
  },

  async listRecords(filters?: {
    search?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<VehicleRecord[]> {
    let query = supabase
      .from('vehicle_records')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.search) {
      query = query.or(
        `vehicle_plate.ilike.%${filters.search}%,pickup_name.ilike.%${filters.search}%,return_name.ilike.%${filters.search}%`
      );
    }

    if (filters?.status && filters.status !== 'Todos') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    let filtered = (data || []) as unknown as VehicleRecord[];

    if (filters?.startDate || filters?.endDate) {
      filtered = filtered.filter((record) => {
        const recordDate = record.pickup_date.split('T')[0];
        const passStart = filters?.startDate ? recordDate >= filters.startDate : true;
        const passEnd = filters?.endDate ? recordDate <= filters.endDate : true;
        return passStart && passEnd;
      });
    }

    return filtered;
  },

  async getRecord(id: string): Promise<VehicleRecord | null> {
    const { data, error } = await supabase
      .from('vehicle_records')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as unknown as VehicleRecord | null;
  },

  async updateRecord(
    id: string,
    data: Partial<VehicleRecordInput>
  ): Promise<VehicleRecord> {
    const { data: record, error } = await supabase
      .from('vehicle_records')
      .update({ ...data, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return record as unknown as VehicleRecord;
  },

  async deleteRecord(id: string): Promise<void> {
    const { data: recordData } = await supabase
      .from('vehicle_records')
      .select('vehicle_plate, status')
      .eq('id', id)
      .maybeSingle();

    const { error } = await supabase
      .from('vehicle_records')
      .delete()
      .eq('id', id);

    if (error) throw error;

    const record = recordData as unknown as Pick<VehicleRecord, 'vehicle_plate' | 'status'> | null;
    if (record?.status === 'Em uso' && record.vehicle_plate?.trim()) {
      const { error: patioError } = await supabase
        .from('vehicles')
        .update({ in_patio: true, updated_at: new Date().toISOString() } as never)
        .ilike('plate', record.vehicle_plate.trim());

      if (patioError) throw patioError;
    }
  },
};
