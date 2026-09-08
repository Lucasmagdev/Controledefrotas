import { supabase } from '../lib/supabase';
import type { VehicleInspectionRequest, VehicleInspectionRequestInput, Json } from '../types/database';

export const inspectionService = {
  async listRequests(): Promise<VehicleInspectionRequest[]> {
    const { data, error } = await supabase
      .from('vehicle_inspection_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createRequest(input: VehicleInspectionRequestInput): Promise<VehicleInspectionRequest> {
    const { data, error } = await supabase
      .from('vehicle_inspection_requests')
      .insert({
        vehicle_id: input.vehicle_id,
        vehicle_plate: input.vehicle_plate,
        vehicle_name: input.vehicle_name,
        requested_by: input.requested_by,
        notes: input.notes?.trim() || '',
      } as never)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completeRequest(
    id: string,
    completedBy: string,
    checklist: Json,
    completedNotes?: string
  ): Promise<VehicleInspectionRequest> {
    const { data, error } = await supabase
      .from('vehicle_inspection_requests')
      .update({
        status: 'Concluida',
        checklist,
        completed_by: completedBy,
        completed_notes: completedNotes?.trim() || '',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteRequest(id: string): Promise<void> {
    const { error } = await supabase.from('vehicle_inspection_requests').delete().eq('id', id);
    if (error) throw error;
  },

  subscribeToRequests(onChange: () => void) {
    const channel = supabase
      .channel('vehicle_inspection_requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicle_inspection_requests' },
        onChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
