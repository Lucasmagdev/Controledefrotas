export interface VehicleRecord {
  id: string;
  vehicle_plate: string;
  reason: string;
  authorized_by: string;
  pickup_date: string;
  pickup_time: string;
  pickup_name: string;
  pickup_signature: string;
  return_date: string | null;
  return_time: string | null;
  return_name: string | null;
  return_signature: string | null;
  observations: string | null;
  status: 'Em uso' | 'Devolvido';
  created_at: string;
  updated_at: string;
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type VehicleStatus = 'Ativo' | 'Inativo' | 'Em Manut.';
export type VehicleUsageType = 'Comum' | 'Rota';
export type OperationType = 'Obras' | 'Trajeto curto' | 'Viagem';
export type MovementStatus = 'Em aberto' | 'Concluida';
export type FuelLevel = 'Reserva' | '1/4' | '1/2' | '3/4' | 'Cheio';

export interface FleetVehicle {
  id: string;
  short_code: string;
  in_patio: boolean;
  plate: string;
  name: string;
  responsible_name: string;
  usage_type: VehicleUsageType;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface FleetVehicleInput {
  plate: string;
  name: string;
  responsible_name: string;
  usage_type: VehicleUsageType;
  status: VehicleStatus;
}

export interface DriverRecord {
  id: string;
  short_code: string;
  name: string;
  cnh_number: string | null;
  cnh_valid_until: string | null;
  origin: 'manual' | 'historico';
  is_active: boolean;
  phone?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DriverInput {
  name: string;
  cnh_number?: string | null;
  cnh_valid_until?: string | null;
  origin?: 'manual' | 'historico';
  is_active?: boolean;
  phone?: string;
  notes?: string;
}

export interface OperationalPhoto {
  id: string;
  movement_id: string;
  phase: 'Entrada' | 'Saida';
  file_path: string;
  file_url: string;
  caption?: string | null;
  created_at: string;
}

export interface OperationalChecklistItem {
  id: string;
  movement_id: string;
  phase: 'Entrada' | 'Saida';
  item_key: string;
  item_label: string;
  is_ok: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface OperationalMovement {
  id: string;
  short_code: string;
  vehicle_id: string;
  vehicle_plate: string;
  operation_type: OperationType;
  driver_id: string | null;
  driver_name: string;
  driver_cnh_number: string | null;
  driver_cnh_valid_until: string | null;
  qr_identifier: string | null;
  entry_date: string;
  entry_time: string;
  entry_odometer: number;
  entry_fuel_level: FuelLevel;
  entry_observations?: string | null;
  exit_date: string | null;
  exit_time: string | null;
  exit_odometer: number | null;
  exit_fuel_level: FuelLevel | null;
  exit_observations?: string | null;
  checklist: Json;
  status: MovementStatus;
  created_at: string;
  updated_at: string;
}

export interface VehicleRecordInput {
  vehicle_plate: string;
  reason: string;
  authorized_by: string;
  pickup_date: string;
  pickup_time: string;
  pickup_name: string;
  pickup_signature: string;
  return_date?: string;
  return_time?: string;
  return_name?: string;
  return_signature?: string;
  observations?: string;
  status: 'Em uso' | 'Devolvido';
}

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: FleetVehicle;
        Insert: {
          id?: string;
          short_code?: string;
          plate: string;
          name: string;
          responsible_name?: string;
          usage_type?: VehicleUsageType;
          status: VehicleStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          short_code?: string;
          plate?: string;
          name?: string;
          responsible_name?: string;
          usage_type?: VehicleUsageType;
          status?: VehicleStatus;
          updated_at?: string;
        };
      };
      vehicle_records: {
        Row: VehicleRecord;
        Insert: Omit<VehicleRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<VehicleRecord, 'id' | 'created_at' | 'updated_at'>>;
      };
      drivers: {
        Row: DriverRecord;
        Insert: Omit<DriverRecord, 'id' | 'short_code' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DriverRecord, 'id' | 'short_code' | 'created_at' | 'updated_at'>>;
      };
      operational_movements: {
        Row: OperationalMovement;
        Insert: Omit<OperationalMovement, 'id' | 'short_code' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OperationalMovement, 'id' | 'short_code' | 'created_at' | 'updated_at'>>;
      };
      operational_photos: {
        Row: OperationalPhoto;
        Insert: Omit<OperationalPhoto, 'id' | 'created_at'>;
        Update: Partial<Omit<OperationalPhoto, 'id' | 'created_at'>>;
      };
      operational_checklist_items: {
        Row: OperationalChecklistItem;
        Insert: Omit<OperationalChecklistItem, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<OperationalChecklistItem, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
