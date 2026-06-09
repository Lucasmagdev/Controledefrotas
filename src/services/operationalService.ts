import { supabase } from '../lib/supabase';
import type {
  DriverInput,
  DriverRecord,
  FuelLevel,
  Json,
  OperationalMovement,
  OperationType,
} from '../types/database';

const PHOTO_BUCKET = 'vehicle-operation-photos';
const DRIVER_CNH_BUCKET = 'driver-cnh-documents';

const CHECKLIST_LABELS: Record<string, string> = {
  pneus: 'Pneus e estepe',
  luzes: 'Luzes e sinalização',
  vidros: 'Vidros e espelhos',
  limpeza: 'Limpeza geral',
  odometro: 'Odômetro conferido',
  avarias: 'Sem avarias aparentes',
};

export interface MovementInput {
  vehicle_id: string;
  vehicle_plate: string;
  operation_type: OperationType;
  driver_id: string | null;
  driver_name: string;
  driver_cnh_number: string | null;
  driver_cnh_valid_until: string | null;
  qr_identifier?: string | null;
  entry_date: string;
  entry_time: string;
  entry_odometer: number;
  entry_fuel_level: FuelLevel;
  entry_observations?: string;
  checklist: Json;
}

export interface MovementCloseInput {
  driver_id?: string | null;
  driver_name?: string;
  driver_cnh_number?: string | null;
  driver_cnh_valid_until?: string | null;
  exit_date: string;
  exit_time: string;
  exit_odometer: number;
  exit_fuel_level: FuelLevel;
  exit_observations?: string;
  checklist: Json;
}

async function uploadPhotos(
  movementId: string,
  phase: 'Entrada' | 'Saida',
  files: File[]
): Promise<Array<{ movement_id: string; phase: 'Entrada' | 'Saida'; file_path: string; file_url: string; caption: string }>> {
  if (files.length === 0) {
    return [];
  }

  const uploaded = await Promise.all(
    files.map(async (file, index) => {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${movementId}/${phase.toLowerCase()}/${Date.now()}-${index}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(filePath, file, {
          contentType: file.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(filePath);

      return {
        movement_id: movementId,
        phase,
        file_path: filePath,
        file_url: data.publicUrl,
        caption: file.name,
      };
    })
  );

  return uploaded;
}

function getChecklistPhaseGroup(checklist: Json, sourceKey: 'entry' | 'exit') {
  if (!checklist || typeof checklist !== 'object' || Array.isArray(checklist)) {
    return {};
  }

  const phaseGroup = (checklist as Record<string, Json | undefined>)[sourceKey];
  if (!phaseGroup || typeof phaseGroup !== 'object' || Array.isArray(phaseGroup)) {
    return {};
  }

  return phaseGroup as Record<string, { ok?: unknown; note?: unknown } | undefined>;
}

async function upsertChecklistItems(
  movementId: string,
  phase: 'Entrada' | 'Saida',
  checklist: Json,
  sourceKey: 'entry' | 'exit'
) {
  const group = getChecklistPhaseGroup(checklist, sourceKey);
  const rows = Object.entries(CHECKLIST_LABELS).map(([itemKey, itemLabel]) => {
    const item = group[itemKey];
    return {
      movement_id: movementId,
      phase,
      item_key: itemKey,
      item_label: itemLabel,
      is_ok: !!item?.ok,
      note: typeof item?.note === 'string' ? item.note : '',
    };
  });

  const { error } = await (supabase.from('operational_checklist_items') as any)
    .upsert(rows, { onConflict: 'movement_id,phase,item_key' });

  if (error) {
    throw error;
  }
}

function normalizeText(value: string) {
  return value.trim().toUpperCase();
}

function normalizeName(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export const operationalService = {
  async listDrivers(): Promise<DriverRecord[]> {
    const { data, error } = await (supabase.from('drivers') as any).select('*').order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  },

  async createDriver(input: DriverInput): Promise<DriverRecord> {
    const payload = {
      ...input,
      name: input.name.trim(),
      cnh_number: input.cnh_number?.trim() ? normalizeText(input.cnh_number) : null,
      cnh_valid_until: input.cnh_valid_until?.trim() || null,
      origin: input.origin || 'manual',
      is_active: input.is_active ?? true,
      phone: input.phone?.trim() || '',
      notes: input.notes?.trim() || '',
    };

    const { data, error } = await (supabase.from('drivers') as any).insert(payload).select().single();

    if (error) {
      throw error;
    }

    return data;
  },

  async updateDriver(id: string, input: Partial<DriverInput>): Promise<DriverRecord> {
    const payload = {
      ...input,
      ...(input.name ? { name: input.name.trim() } : {}),
      ...(input.cnh_number !== undefined
        ? { cnh_number: input.cnh_number?.trim() ? normalizeText(input.cnh_number) : null }
        : {}),
      ...(input.cnh_valid_until !== undefined
        ? { cnh_valid_until: input.cnh_valid_until?.trim() || null }
        : {}),
      ...(input.origin ? { origin: input.origin } : {}),
      ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
      ...(input.phone !== undefined ? { phone: input.phone.trim() } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() } : {}),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase.from('drivers') as any).update(payload).eq('id', id).select().single();

    if (error) {
      throw error;
    }

    return data;
  },

  async uploadDriverCnh(driver: DriverRecord, file: File): Promise<DriverRecord> {
    const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('O anexo da CNH deve ter no máximo 10 MB');
    }
    if (file.type && !allowedTypes.has(file.type)) {
      throw new Error('Formato de anexo da CNH não permitido');
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `${driver.id}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage
      .from(DRIVER_CNH_BUCKET)
      .upload(filePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = supabase.storage.from(DRIVER_CNH_BUCKET).getPublicUrl(filePath);

    try {
      const updatedDriver = await this.updateDriver(driver.id, {
        cnh_file_path: filePath,
        cnh_file_url: publicUrlData.publicUrl,
        cnh_file_name: file.name,
        cnh_file_type: file.type || null,
      });

      if (driver.cnh_file_path) {
        await supabase.storage.from(DRIVER_CNH_BUCKET).remove([driver.cnh_file_path]);
      }

      return updatedDriver;
    } catch (error) {
      await supabase.storage.from(DRIVER_CNH_BUCKET).remove([filePath]);
      throw error;
    }
  },

  async deleteDriver(id: string): Promise<void> {
    const { data: driver } = await (supabase.from('drivers') as any)
      .select('cnh_file_path')
      .eq('id', id)
      .maybeSingle();
    const { error } = await (supabase.from('drivers') as any).delete().eq('id', id);

    if (error) {
      throw error;
    }

    if (driver?.cnh_file_path) {
      await supabase.storage.from(DRIVER_CNH_BUCKET).remove([driver.cnh_file_path]);
    }
  },

  async listMovements(): Promise<OperationalMovement[]> {
    const { data, error } = await (supabase.from('operational_movements') as any).select('*').order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  },

  async createMovement(
    input: MovementInput,
    entryPhotos: File[] = []
  ): Promise<OperationalMovement> {
    const { data: movement, error } = await (supabase.from('operational_movements') as any).insert({
        ...input,
        vehicle_plate: normalizeText(input.vehicle_plate),
        driver_name: input.driver_name.trim(),
        driver_cnh_number: input.driver_cnh_number?.trim() ? normalizeText(input.driver_cnh_number) : null,
        driver_cnh_valid_until: input.driver_cnh_valid_until?.trim() || null,
        qr_identifier: input.qr_identifier?.trim() || '',
        entry_observations: input.entry_observations?.trim() || '',
        status: 'Em aberto',
      }).select().single();

    if (error) {
      throw error;
    }

    const { error: vehicleStatusError } = await (supabase.from('vehicles') as any)
      .update({ in_patio: false, updated_at: new Date().toISOString() })
      .eq('id', input.vehicle_id);

    if (vehicleStatusError) {
      throw vehicleStatusError;
    }

    await upsertChecklistItems(movement.id, 'Saida', input.checklist, 'exit');

    if (entryPhotos.length > 0) {
      const photoRows = await uploadPhotos(movement.id, 'Saida', entryPhotos);
      const { error: photoError } = await (supabase.from('operational_photos') as any).insert(photoRows);

      if (photoError) {
        throw photoError;
      }
    }

    return movement;
  },

  async closeMovement(
    id: string,
    input: MovementCloseInput,
    exitPhotos: File[] = []
  ): Promise<OperationalMovement> {
    const { data: movement, error } = await (supabase.from('operational_movements') as any).update({
        ...(input.driver_id !== undefined ? { driver_id: input.driver_id } : {}),
        ...(input.driver_name !== undefined ? { driver_name: input.driver_name.trim() } : {}),
        ...(input.driver_cnh_number !== undefined
          ? { driver_cnh_number: input.driver_cnh_number?.trim() ? normalizeText(input.driver_cnh_number) : null }
          : {}),
        ...(input.driver_cnh_valid_until !== undefined
          ? { driver_cnh_valid_until: input.driver_cnh_valid_until?.trim() || null }
          : {}),
        exit_date: input.exit_date,
        exit_time: input.exit_time,
        exit_odometer: input.exit_odometer,
        exit_fuel_level: input.exit_fuel_level,
        exit_observations: input.exit_observations?.trim() || '',
        checklist: input.checklist,
        status: 'Concluida',
        updated_at: new Date().toISOString(),
      }).eq('id', id).select().single();

    if (error) {
      throw error;
    }

    const { error: vehicleStatusError } = await (supabase.from('vehicles') as any)
      .update({ in_patio: true, updated_at: new Date().toISOString() })
      .eq('id', movement.vehicle_id);

    if (vehicleStatusError) {
      throw vehicleStatusError;
    }

    await upsertChecklistItems(movement.id, 'Entrada', input.checklist, 'entry');

    if (exitPhotos.length > 0) {
      const photoRows = await uploadPhotos(movement.id, 'Entrada', exitPhotos);
      const { error: photoError } = await (supabase.from('operational_photos') as any).insert(photoRows);

      if (photoError) {
        throw photoError;
      }
    }

    return movement;
  },

  async deleteMovement(id: string): Promise<void> {
    const { error } = await (supabase.from('operational_movements') as any).delete().eq('id', id);

    if (error) {
      throw error;
    }
  },

  normalizeName,
};
