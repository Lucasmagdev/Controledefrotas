import { supabase } from '../lib/supabase';
import type { FleetVehicle, FleetVehicleInput, VehicleStatus } from '../types/database';

interface VehicleFilters {
  search?: string;
  status?: VehicleStatus | 'Todos';
}

export const vehicleCatalogService = {
  async listVehicles(filters?: VehicleFilters): Promise<FleetVehicle[]> {
    let query = supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.search) {
      const sanitizedSearch = filters.search.trim();
      if (sanitizedSearch) {
        query = query.or(`plate.ilike.%${sanitizedSearch}%,name.ilike.%${sanitizedSearch}%,short_code.ilike.%${sanitizedSearch}%`);
      }
    }

    if (filters?.status && filters.status !== 'Todos') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  },

  async createVehicle(input: FleetVehicleInput): Promise<FleetVehicle> {
    const payload: FleetVehicleInput = {
      ...input,
      plate: input.plate.trim().toUpperCase(),
      name: input.name.trim(),
    };

    const { data, error } = await supabase
      .from('vehicles')
      .insert(payload as never)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async updateVehicle(id: string, input: Partial<FleetVehicleInput>): Promise<FleetVehicle> {
    const normalizedInput: Partial<FleetVehicleInput> = {
      ...input,
      ...(input.plate ? { plate: input.plate.trim().toUpperCase() } : {}),
      ...(input.name ? { name: input.name.trim() } : {}),
    };

    const { data, error } = await supabase
      .from('vehicles')
      .update({ ...normalizedInput, updated_at: new Date().toISOString() } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  },

  async deleteVehicle(id: string): Promise<void> {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  },
};
