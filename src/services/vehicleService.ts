import { supabase } from '../lib/supabase';
import type { VehicleRecord, VehicleRecordInput } from '../types/database';

export const vehicleService = {
  async createRecord(data: VehicleRecordInput): Promise<VehicleRecord> {
    console.log('🚀 Criando novo registro no Supabase...');
    const { data: record, error } = await supabase
      .from('vehicle_records')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar registro:', error);
      throw error;
    }
    
    console.log('✅ Registro criado com ID:', record?.id);
    return record;
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

    if (filters?.startDate) {
      query = query.gte('pickup_date', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('pickup_date', filters.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getRecord(id: string): Promise<VehicleRecord | null> {
    const { data, error } = await supabase
      .from('vehicle_records')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateRecord(
    id: string,
    data: Partial<VehicleRecordInput>
  ): Promise<VehicleRecord> {
    const { data: record, error } = await supabase
      .from('vehicle_records')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return record;
  },

  async deleteRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicle_records')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
