export interface VehicleRecord {
  id: string;
  vehicle_plate: string;
  reason: string;
  authorized_by: string;
  usage_type?: VehicleUsageType;
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
export type PersonType = 'Funcionario' | 'Terceirizado' | 'Visitante';
export type AccessStatus = 'Em aberto' | 'Concluido';

export interface FleetVehicle {
  id: string;
  short_code: string;
  legacy_short_code: string | null;
  in_patio: boolean;
  plate: string;
  name: string;
  responsible_name: string;
  fixed_driver_name: string;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface FleetVehicleInput {
  plate: string;
  name: string;
  responsible_name: string;
  fixed_driver_name: string;
  status: VehicleStatus;
}

export interface PersonRecord {
  id: string;
  short_code: string;
  person_type: PersonType;
  name: string;
  document_number: string | null;
  cnh_number: string | null;
  cnh_valid_until: string | null;
  cnh_file_path: string | null;
  cnh_file_url: string | null;
  cnh_file_name: string | null;
  cnh_file_type: string | null;
  origin: 'manual' | 'historico' | 'drivers';
  is_active: boolean;
  is_driver: boolean;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonInput {
  person_type: PersonType;
  name: string;
  document_number?: string | null;
  cnh_number?: string | null;
  cnh_valid_until?: string | null;
  cnh_file_path?: string | null;
  cnh_file_url?: string | null;
  cnh_file_name?: string | null;
  cnh_file_type?: string | null;
  origin?: 'manual' | 'historico' | 'drivers';
  is_active?: boolean;
  is_driver?: boolean;
  phone?: string;
  company?: string;
  notes?: string;
}

export type DriverRecord = PersonRecord;
export type DriverInput = Omit<PersonInput, 'person_type'> & { person_type?: PersonType };

export interface PersonalVehicle {
  id: string;
  short_code: string;
  person_id: string;
  plate: string;
  name: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  person?: PersonRecord;
}

export interface PersonalVehicleInput {
  person_id: string;
  plate: string;
  name?: string;
  notes?: string;
  is_active?: boolean;
}

export interface AccessRecord {
  id: string;
  short_code: string;
  person_id: string;
  person_name: string;
  person_type: PersonType;
  host_person_id: string | null;
  host_person_name: string;
  personal_vehicle_id: string | null;
  vehicle_plate: string | null;
  reason: string | null;
  entry_date: string;
  entry_time: string;
  exit_date: string | null;
  exit_time: string | null;
  document_file_path: string | null;
  document_file_name: string | null;
  document_file_type: string | null;
  observations: string | null;
  status: AccessStatus;
  created_at: string;
  updated_at: string;
}

export interface AccessRecordInput {
  person_id: string;
  person_name: string;
  person_type: PersonType;
  host_person_id?: string | null;
  host_person_name: string;
  personal_vehicle_id?: string | null;
  vehicle_plate?: string;
  reason?: string;
  entry_date: string;
  entry_time: string;
  observations?: string;
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
  usage_type?: VehicleUsageType;
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
          legacy_short_code?: string | null;
          plate: string;
          name: string;
          responsible_name?: string;
          fixed_driver_name?: string;
          status: VehicleStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          short_code?: string;
          legacy_short_code?: string | null;
          plate?: string;
          name?: string;
          responsible_name?: string;
          fixed_driver_name?: string;
          status?: VehicleStatus;
          updated_at?: string;
        };
      };
      vehicle_records: {
        Row: VehicleRecord;
        Insert: Omit<VehicleRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<VehicleRecord, 'id' | 'created_at' | 'updated_at'>>;
      };
      people: {
        Row: PersonRecord;
        Insert: Omit<PersonRecord, 'id' | 'short_code' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PersonRecord, 'id' | 'short_code' | 'created_at' | 'updated_at'>>;
      };
      drivers: {
        Row: DriverRecord;
        Insert: Omit<DriverRecord, 'id' | 'short_code' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DriverRecord, 'id' | 'short_code' | 'created_at' | 'updated_at'>>;
      };
      personal_vehicles: {
        Row: PersonalVehicle;
        Insert: Omit<PersonalVehicle, 'id' | 'short_code' | 'created_at' | 'updated_at' | 'person'>;
        Update: Partial<Omit<PersonalVehicle, 'id' | 'short_code' | 'created_at' | 'updated_at' | 'person'>>;
      };
      access_records: {
        Row: AccessRecord;
        Insert: Omit<AccessRecord, 'id' | 'short_code' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<AccessRecord, 'id' | 'short_code' | 'created_at' | 'updated_at'>>;
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
