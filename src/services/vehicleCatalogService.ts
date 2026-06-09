import { supabase } from '../lib/supabase';
import type { FleetVehicle, FleetVehicleInput, VehicleStatus } from '../types/database';

interface VehicleFilters {
  search?: string;
  status?: VehicleStatus | 'Todos';
  inPatio?: boolean;
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
        query = query.or(`plate.ilike.%${sanitizedSearch}%,name.ilike.%${sanitizedSearch}%,responsible_name.ilike.%${sanitizedSearch}%,fixed_driver_name.ilike.%${sanitizedSearch}%,short_code.ilike.%${sanitizedSearch}%,legacy_short_code.ilike.%${sanitizedSearch}%`);
      }
    }

    if (filters?.status && filters.status !== 'Todos') {
      query = query.eq('status', filters.status);
    }

    if (typeof filters?.inPatio === 'boolean') {
      query = query.eq('in_patio', filters.inPatio);
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
      fixed_driver_name: input.fixed_driver_name.trim(),
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
      ...(input.fixed_driver_name !== undefined ? { fixed_driver_name: input.fixed_driver_name.trim() } : {}),
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

  async updatePatioStatus(id: string, inPatio: boolean): Promise<FleetVehicle> {
    const { data, error } = await supabase
      .from('vehicles')
      .update({ in_patio: inPatio, updated_at: new Date().toISOString() } as never)
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
