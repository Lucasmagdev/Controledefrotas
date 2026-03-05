import type { VehicleRecord } from '../types/database';

export interface DashboardStats {
  totalInUse: number;
  totalReturned: number;
  totalRecords: number;
  utilizationRate: number; // Percentual de veículos em uso
}

export interface VehicleWithUsageTime extends VehicleRecord {
  usageTimeHours: number;
  usageTimeDays: number;
}

export interface ReasonStats {
  reason: string;
  count: number;
  percentage: number;
}

export interface UserStats {
  name: string;
  pickupCount: number;
  returnCount: number;
}

export interface VehicleUsageStats {
  plate: string;
  totalUses: number;
  currentlyInUse: boolean;
}

export const reportService = {
  /**
   * Calcula estatísticas gerais do dashboard
   */
  getDashboardStats(records: VehicleRecord[]): DashboardStats {
    const totalRecords = records.length;
    const totalInUse = records.filter(r => r.status === 'Em uso').length;
    const totalReturned = records.filter(r => r.status === 'Devolvido').length;
    
    // Assumindo que cada registro único representa um veículo em uso ou devolvido
    const utilizationRate = totalRecords > 0 ? (totalInUse / totalRecords) * 100 : 0;

    return {
      totalInUse,
      totalReturned,
      totalRecords,
      utilizationRate,
    };
  },

  /**
   * Retorna veículos em uso ordenados por tempo de uso
   */
  getVehiclesInUse(records: VehicleRecord[]): VehicleWithUsageTime[] {
    const inUseRecords = records.filter(r => r.status === 'Em uso');
    
    return inUseRecords.map(record => {
      const pickupDateTime = new Date(`${record.pickup_date}T${record.pickup_time}`);
      const now = new Date();
      const diffMs = now.getTime() - pickupDateTime.getTime();
      const usageTimeHours = Math.floor(diffMs / (1000 * 60 * 60));
      const usageTimeDays = Math.floor(usageTimeHours / 24);

      return {
        ...record,
        usageTimeHours,
        usageTimeDays,
      };
    }).sort((a, b) => b.usageTimeHours - a.usageTimeHours);
  },

  /**
   * Calcula estatísticas de motivos de uso
   */
  getReasonStats(records: VehicleRecord[]): ReasonStats[] {
    const reasonCount = new Map<string, number>();
    
    records.forEach(record => {
      const count = reasonCount.get(record.reason) || 0;
      reasonCount.set(record.reason, count + 1);
    });

    const total = records.length;
    const stats: ReasonStats[] = [];

    reasonCount.forEach((count, reason) => {
      stats.push({
        reason,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      });
    });

    return stats.sort((a, b) => b.count - a.count);
  },

  /**
   * Estatísticas de usuários (quem mais retira veículos)
   */
  getUserStats(records: VehicleRecord[]): UserStats[] {
    const userMap = new Map<string, { pickupCount: number; returnCount: number }>();

    records.forEach(record => {
      // Contabilizar retiradas
      const pickupStats = userMap.get(record.pickup_name) || { pickupCount: 0, returnCount: 0 };
      pickupStats.pickupCount += 1;
      userMap.set(record.pickup_name, pickupStats);

      // Contabilizar devoluções
      if (record.return_name) {
        const returnStats = userMap.get(record.return_name) || { pickupCount: 0, returnCount: 0 };
        returnStats.returnCount += 1;
        userMap.set(record.return_name, returnStats);
      }
    });

    const stats: UserStats[] = [];
    userMap.forEach((value, name) => {
      stats.push({
        name,
        pickupCount: value.pickupCount,
        returnCount: value.returnCount,
      });
    });

    return stats.sort((a, b) => b.pickupCount - a.pickupCount);
  },

  /**
   * Ranking de veículos mais utilizados
   */
  getVehicleUsageRanking(records: VehicleRecord[]): VehicleUsageStats[] {
    const vehicleMap = new Map<string, { totalUses: number; currentlyInUse: boolean }>();

    records.forEach(record => {
      const stats = vehicleMap.get(record.vehicle_plate) || { totalUses: 0, currentlyInUse: false };
      stats.totalUses += 1;
      if (record.status === 'Em uso') {
        stats.currentlyInUse = true;
      }
      vehicleMap.set(record.vehicle_plate, stats);
    });

    const ranking: VehicleUsageStats[] = [];
    vehicleMap.forEach((value, plate) => {
      ranking.push({
        plate,
        totalUses: value.totalUses,
        currentlyInUse: value.currentlyInUse,
      });
    });

    return ranking.sort((a, b) => b.totalUses - a.totalUses);
  },

  /**
   * Filtra registros por período
   */
  filterByDateRange(records: VehicleRecord[], startDate: string, endDate: string): VehicleRecord[] {
    const parseDate = (value: string) => {
      const [year, month, day] = value.split('-').map(Number);
      return new Date(year, month - 1, day);
    };

    const rangeStart = parseDate(startDate);
    const rangeEnd = parseDate(endDate);

    return records.filter(record => {
      const pickupDate = parseDate(record.pickup_date);
      const returnDate = record.return_date ? parseDate(record.return_date) : new Date();

      // Um registro pertence ao período quando o intervalo de uso do veículo
      // [pickupDate, returnDate] cruza o intervalo selecionado [rangeStart, rangeEnd].
      return pickupDate <= rangeEnd && returnDate >= rangeStart;
    });
  },

  /**
   * Veículos com atraso (mais de X dias em uso)
   */
  getDelayedVehicles(records: VehicleRecord[], daysThreshold: number = 7): VehicleWithUsageTime[] {
    const vehiclesInUse = this.getVehiclesInUse(records);
    return vehiclesInUse.filter(v => v.usageTimeDays >= daysThreshold);
  },

  /**
   * Tempo médio de uso dos veículos (em horas)
   */
  getAverageUsageTime(records: VehicleRecord[]): number {
    const returnedRecords = records.filter(r => r.status === 'Devolvido' && r.return_date && r.return_time);
    
    if (returnedRecords.length === 0) return 0;

    const totalHours = returnedRecords.reduce((sum, record) => {
      const pickupDateTime = new Date(`${record.pickup_date}T${record.pickup_time}`);
      const returnDateTime = new Date(`${record.return_date}T${record.return_time}`);
      const diffMs = returnDateTime.getTime() - pickupDateTime.getTime();
      const hours = diffMs / (1000 * 60 * 60);
      return sum + hours;
    }, 0);

    return totalHours / returnedRecords.length;
  },

  /**
   * Agrupa registros por data para gráfico de linha do tempo
   */
  getTimelineData(records: VehicleRecord[]): { date: string; pickups: number; returns: number }[] {
    const dateMap = new Map<string, { pickups: number; returns: number }>();

    records.forEach(record => {
      // Contabilizar retiradas
      const pickupDate = record.pickup_date;
      const pickupStats = dateMap.get(pickupDate) || { pickups: 0, returns: 0 };
      pickupStats.pickups += 1;
      dateMap.set(pickupDate, pickupStats);

      // Contabilizar devoluções
      if (record.return_date) {
        const returnDate = record.return_date;
        const returnStats = dateMap.get(returnDate) || { pickups: 0, returns: 0 };
        returnStats.returns += 1;
        dateMap.set(returnDate, returnStats);
      }
    });

    const timeline = Array.from(dateMap.entries()).map(([date, stats]) => ({
      date,
      pickups: stats.pickups,
      returns: stats.returns,
    }));

    return timeline.sort((a, b) => a.date.localeCompare(b.date));
  },
};
