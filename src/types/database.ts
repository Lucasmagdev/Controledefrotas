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

export type VehicleStatus = 'Ativo' | 'Inativo' | 'Em Manut.';

export interface FleetVehicle {
  id: string;
  plate: string;
  name: string;
  responsible_name: string;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface FleetVehicleInput {
  plate: string;
  name: string;
  responsible_name: string;
  status: VehicleStatus;
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
          plate: string;
          name: string;
          responsible_name?: string;
          status: VehicleStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plate?: string;
          name?: string;
          responsible_name?: string;
          status?: VehicleStatus;
          updated_at?: string;
        };
      };
      vehicle_records: {
        Row: VehicleRecord;
        Insert: Omit<VehicleRecord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<VehicleRecord, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
