import { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Car, 
  Clock, 
  AlertCircle,
  Users,
  BarChart3,
  CheckCircle
} from 'lucide-react';
import type { VehicleRecord } from '../types/database';
import { reportService } from '../services/reportService';
import { formatDateBR } from '../utils/date';

interface DashboardProps {
  records: VehicleRecord[];
}

type PeriodFilter = 'day' | 'week' | 'month' | 'custom';

export function Dashboard({ records }: DashboardProps) {
  const toDateInputValue = (date: Date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = toDateInputValue(new Date());
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('day');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [customStartDate, setCustomStartDate] = useState<string>(today);
  const [customEndDate, setCustomEndDate] = useState<string>(today);

  const { startDate, endDate } = useMemo(() => {
    const baseDate = new Date(`${selectedDate}T00:00:00`);

    if (periodFilter === 'day') {
      return { startDate: selectedDate, endDate: selectedDate };
    }

    if (periodFilter === 'week') {
      const dayOfWeek = baseDate.getDay();
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      const weekStart = new Date(baseDate);
      weekStart.setDate(baseDate.getDate() + mondayOffset);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      return {
        startDate: toDateInputValue(weekStart),
        endDate: toDateInputValue(weekEnd),
      };
    }

    if (periodFilter === 'month') {
      const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
      const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);

      return {
        startDate: toDateInputValue(monthStart),
        endDate: toDateInputValue(monthEnd),
      };
    }

    return {
      startDate: customStartDate,
      endDate: customEndDate,
    };
  }, [periodFilter, selectedDate, customStartDate, customEndDate]);

  const filteredRecords = useMemo(() => {
    if (!startDate || !endDate) {
      return records;
    }

    if (startDate > endDate) {
      return [];
    }

    return reportService.filterByDateRange(records, startDate, endDate);
  }, [records, startDate, endDate]);

  const stats = useMemo(() => reportService.getDashboardStats(filteredRecords), [filteredRecords]);
  const vehiclesInUse = useMemo(() => reportService.getVehiclesInUse(filteredRecords), [filteredRecords]);
  const reasonStats = useMemo(() => reportService.getReasonStats(filteredRecords), [filteredRecords]);
  const userStats = useMemo(() => reportService.getUserStats(filteredRecords).slice(0, 5), [filteredRecords]);
  const vehicleRanking = useMemo(() => reportService.getVehicleUsageRanking(filteredRecords).slice(0, 5), [filteredRecords]);
  const delayedVehicles = useMemo(() => reportService.getDelayedVehicles(filteredRecords, 7), [filteredRecords]);
  const avgUsageTime = useMemo(() => reportService.getAverageUsageTime(filteredRecords), [filteredRecords]);
  const vehiclesUsedInPeriod = useMemo(
    () => new Set(filteredRecords.map((record) => record.vehicle_plate)).size,
    [filteredRecords],
  );

  const formatUsageTime = (hours: number, days: number) => {
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h`;
  };

  const formatAvgTime = (hours: number) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.floor(hours % 24);
      return `${days}d ${remainingHours}h`;
    }
    return `${Math.floor(hours)}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-blue-600" />
          Dashboard de Relatórios
        </h2>
        <p className="text-gray-600 mt-1">Visão geral da frota em tempo real</p>
      </div>

      {/* Filtros de período */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Dia', value: 'day' },
            { label: 'Semana', value: 'week' },
            { label: 'Mês', value: 'month' },
            { label: 'Personalizado', value: 'custom' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setPeriodFilter(option.value as PeriodFilter)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                periodFilter === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {periodFilter !== 'custom' ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <label className="text-sm font-medium text-gray-700 min-w-28">Data base</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data inicial</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(event) => setCustomStartDate(event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data final</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(event) => setCustomEndDate(event.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600">
          Período aplicado: <strong>{formatDateBR(startDate)}</strong> a{' '}
          <strong>{formatDateBR(endDate)}</strong>
          {' '}({filteredRecords.length} registro{filteredRecords.length === 1 ? '' : 's'})
        </p>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Veículos utilizados no período */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Veículos Utilizados</p>
              <p className="text-3xl font-bold mt-1">{vehiclesUsedInPeriod}</p>
            </div>
            <div className="bg-blue-400 bg-opacity-30 p-3 rounded-full">
              <Car className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-blue-100 text-sm">
            <TrendingUp className="w-4 h-4 mr-1" />
            {stats.totalRecords} movimentações no período
          </div>
        </div>

        {/* Veículos Devolvidos */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Devolvidos</p>
              <p className="text-3xl font-bold mt-1">{stats.totalReturned}</p>
            </div>
            <div className="bg-green-400 bg-opacity-30 p-3 rounded-full">
              <CheckCircle className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-100 text-sm">
            <TrendingDown className="w-4 h-4 mr-1" />
            {(100 - stats.utilizationRate).toFixed(0)}% completos
          </div>
        </div>

        {/* Tempo Médio de Uso */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Tempo Médio</p>
              <p className="text-3xl font-bold mt-1">{formatAvgTime(avgUsageTime)}</p>
            </div>
            <div className="bg-purple-400 bg-opacity-30 p-3 rounded-full">
              <Clock className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-purple-100 text-sm">
            <Clock className="w-4 h-4 mr-1" />
            Por utilização
          </div>
        </div>

        {/* Alertas */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Alertas</p>
              <p className="text-3xl font-bold mt-1">{delayedVehicles.length}</p>
            </div>
            <div className="bg-orange-400 bg-opacity-30 p-3 rounded-full">
              <AlertCircle className="w-8 h-8" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-orange-100 text-sm">
            <AlertCircle className="w-4 h-4 mr-1" />
            Mais de 7 dias
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Veículos em Uso Atual */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            Em Uso no Período ({vehiclesInUse.length})
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {vehiclesInUse.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Nenhum veículo em uso no período</p>
            ) : (
              vehiclesInUse.map((vehicle) => (
                <div 
                  key={vehicle.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{vehicle.vehicle_plate}</p>
                    <p className="text-sm text-gray-600">{vehicle.pickup_name}</p>
                    <p className="text-xs text-gray-500">{vehicle.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${vehicle.usageTimeDays >= 7 ? 'text-orange-600' : 'text-blue-600'}`}>
                      {formatUsageTime(vehicle.usageTimeHours, vehicle.usageTimeDays)}
                    </p>
                    <p className="text-xs text-gray-500">em uso</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ranking de Veículos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Veículos Mais Utilizados
          </h3>
          <div className="space-y-3">
            {vehicleRanking.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Sem dados disponíveis</p>
            ) : (
              vehicleRanking.map((vehicle, index) => (
                <div key={vehicle.plate} className="flex items-center gap-3">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : 
                    index === 1 ? 'bg-gray-400' : 
                    index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{vehicle.plate}</p>
                    <p className="text-sm text-gray-600">{vehicle.totalUses} utiliza{vehicle.totalUses === 1 ? 'ção' : 'ções'}</p>
                  </div>
                  {vehicle.currentlyInUse && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      Em uso
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Motivos de Uso */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Motivos de Uso
          </h3>
          <div className="space-y-3">
            {reasonStats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Sem dados disponíveis</p>
            ) : (
              reasonStats.map((stat) => (
                <div key={stat.reason} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">{stat.reason}</span>
                    <span className="text-gray-600">{stat.count} ({stat.percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Usuários Mais Ativos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Usuários Mais Ativos
          </h3>
          <div className="space-y-3">
            {userStats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">Sem dados disponíveis</p>
            ) : (
              userStats.map((user) => (
                <div key={user.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-600 font-semibold text-sm">
                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">
                        {user.pickupCount} retirada{user.pickupCount !== 1 ? 's' : ''}
                        {user.returnCount > 0 && `, ${user.returnCount} devolução${user.returnCount !== 1 ? 'ões' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-indigo-600 font-bold text-lg">
                    {user.pickupCount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Alertas de Atraso */}
      {delayedVehicles.length > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            Veículos com Possível Atraso (7+ dias)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {delayedVehicles.map((vehicle) => (
              <div key={vehicle.id} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-900">{vehicle.vehicle_plate}</p>
                    <p className="text-sm text-gray-600 mt-1">{vehicle.pickup_name}</p>
                    <p className="text-xs text-gray-500 mt-1">{vehicle.reason}</p>
                  </div>
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">
                    {vehicle.usageTimeDays}d
                  </span>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Retirado em: {formatDateBR(vehicle.pickup_date)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
