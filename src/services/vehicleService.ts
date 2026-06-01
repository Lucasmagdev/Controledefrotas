import { supabase } from '../lib/supabase';
import type { VehicleRecord, VehicleRecordInput } from '../types/database';

export const vehicleService = {
  async createRecord(data: VehicleRecordInput): Promise<VehicleRecord> {
    console.log('🚀 Criando novo registro no Supabase...');
    const { data: record, error } = await (supabase.from('vehicle_records') as any)
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
    // Primeiro, buscar TODOS os registros
    let query: any = (supabase.from('vehicle_records') as any)
      .select('*')
      .order('created_at', { ascending: false });

    console.log('🔍 Filtrando registros com:', filters);

    if (filters?.search) {
      query = query.or(
        `vehicle_plate.ilike.%${filters.search}%,pickup_name.ilike.%${filters.search}%,return_name.ilike.%${filters.search}%`
      );
      console.log('📝 Filtro de busca aplicado:', filters.search);
    }

    if (filters?.status && filters.status !== 'Todos') {
      query = query.eq('status', filters.status);
      console.log('📊 Filtro de status aplicado:', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filtrar através de JavaScript (mais confiável que timestamps)
    let filtered: VehicleRecord[] = (data || []) as VehicleRecord[];

    if (filters?.startDate || filters?.endDate) {
      console.log('📅 Filtrando por data:', { startDate: filters?.startDate, endDate: filters?.endDate });

      filtered = filtered.filter(record => {
        // Extrair apenas a data do pickup_date (ignorar hora e timezone)
        const recordDate = record.pickup_date.split('T')[0]; // "2026-03-04"
        
        let passStart = true;
        let passEnd = true;

        if (filters?.startDate) {
          passStart = recordDate >= filters.startDate;
          console.log(`  📌 ${record.vehicle_plate}: ${recordDate} >= ${filters.startDate} ? ${passStart}`);
        }

        if (filters?.endDate) {
          passEnd = recordDate <= filters.endDate;
          console.log(`  📌 ${record.vehicle_plate}: ${recordDate} <= ${filters.endDate} ? ${passEnd}`);
        }

        return passStart && passEnd;
      });
    }

    console.log(`✅ ${filtered.length} registro(s) encontrado(s) após filtros`);
    return filtered;
  },

  async getRecord(id: string): Promise<VehicleRecord | null> {
    const { data, error } = await (supabase.from('vehicle_records') as any)
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
    const { data: record, error } = await (supabase.from('vehicle_records') as any)
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return record;
  },

  async deleteRecord(id: string): Promise<void> {
    const { error } = await (supabase.from('vehicle_records') as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
