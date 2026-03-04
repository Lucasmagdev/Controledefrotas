import { useState, useEffect } from 'react';
import { Search, Filter, Download, Printer, Eye, CreditCard as Edit, Trash2 } from 'lucide-react';
import { vehicleService } from '../services/vehicleService';
import { RecordDetails } from './RecordDetails';
import { Modal } from './Modal';
import { VehicleForm } from './VehicleForm';
import { exportToCSV, generatePrintReport } from '../utils/export';
import type { VehicleRecord } from '../types/database';

interface DatabaseViewProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  refreshTrigger?: number;
}

export function DatabaseView({ onSuccess, onError, refreshTrigger }: DatabaseViewProps) {
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<VehicleRecord | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<VehicleRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadRecords = async () => {
    try {
      setLoading(true);
      console.log('📥 Carregando registros do Supabase...');
      const data = await vehicleService.listRecords({
        search: searchTerm,
        status: statusFilter,
        startDate,
        endDate,
      });
      console.log(`✅ ${data.length} registro(s) carregado(s)`, data);
      setRecords(data);
      setFilteredRecords(data);
    } catch (error) {
      console.error('Error loading records:', error);
      onError('Erro ao carregar registros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [refreshTrigger]);

  useEffect(() => {
    loadRecords();
  }, [searchTerm, statusFilter, startDate, endDate]);

  const handleDelete = async (id: string) => {
    try {
      await vehicleService.deleteRecord(id);
      onSuccess('Registro excluído com sucesso');
      loadRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      onError('Erro ao excluir registro');
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleEdit = (record: VehicleRecord) => {
    setRecordToEdit(record);
    setIsEditOpen(true);
  };

  const handleExport = () => {
    exportToCSV(filteredRecords);
    onSuccess('Relatório exportado com sucesso');
  };

  const handlePrint = () => {
    generatePrintReport(filteredRecords, { startDate, endDate, status: statusFilter });
  };

  const stats = {
    total: filteredRecords.length,
    inUse: filteredRecords.filter((r) => r.status === 'Em uso').length,
    returned: filteredRecords.filter((r) => r.status === 'Devolvido').length,
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Card de Filtros Premium */}
      <div className="glass card-shine rounded-2xl p-6 shadow-premium animate-fade-in">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-red-500 transition-colors" />
              <input
                type="text"
                placeholder="🔍 Buscar por placa/veículo ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all bg-white text-gray-900 font-medium placeholder:text-gray-400 hover:border-gray-300"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 sm:flex-none min-w-[140px] px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all bg-white text-gray-900 font-medium hover:border-gray-300 cursor-pointer"
            >
              <option value="Todos">📊 Todos</option>
              <option value="Em uso">🔄 Em uso</option>
              <option value="Devolvido">✅ Devolvido</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Data inicial"
              className="flex-1 sm:flex-none px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all bg-white text-gray-900 font-medium hover:border-gray-300"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Data final"
              className="flex-1 sm:flex-none px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 transition-all bg-white text-gray-900 font-medium hover:border-gray-300"
            />
          </div>
        </div>

        {/* Cards de Estatísticas Premium */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl blur-lg group-hover:blur-xl transition-all opacity-0 group-hover:opacity-100"></div>
            <div className="relative glass rounded-2xl p-6 interactive-lift cursor-pointer overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="text-xs font-semibold text-red-600 bg-red-50 px-3 py-1 rounded-full">Total</div>
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-br from-red-600 to-red-700 bg-clip-text text-transparent mb-1">
                {stats.total}
              </div>
              <div className="text-sm font-semibold text-gray-600">Registros</div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-red-500/10 to-transparent rounded-full blur-2xl"></div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-2xl blur-lg group-hover:blur-xl transition-all opacity-0 group-hover:opacity-100"></div>
            <div className="relative glass rounded-2xl p-6 interactive-lift cursor-pointer overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🔄</span>
                </div>
                <div className="text-xs font-semibold text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full">Ativos</div>
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-br from-yellow-600 to-orange-700 bg-clip-text text-transparent mb-1">
                {stats.inUse}
              </div>
              <div className="text-sm font-semibold text-gray-600">Em Uso</div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-full blur-2xl"></div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-2xl blur-lg group-hover:blur-xl transition-all opacity-0 group-hover:opacity-100"></div>
            <div className="relative glass rounded-2xl p-6 interactive-lift cursor-pointer overflow-hidden">
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                  <span className="text-2xl">✅</span>
                </div>
                <div className="text-xs font-semibold text-green-700 bg-green-50 px-3 py-1 rounded-full">Completo</div>
              </div>
              <div className="text-4xl font-extrabold bg-gradient-to-br from-green-600 to-emerald-700 bg-clip-text text-transparent mb-1">
                {stats.returned}
              </div>
              <div className="text-sm font-semibold text-gray-600">Devolvidos</div>
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-green-500/10 to-transparent rounded-full blur-2xl"></div>
            </div>
          </div>
        </div>

        {/* Botões de Ação Premium */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExport}
            className="btn-primary group relative w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all duration-300 shadow-premium hover:shadow-premium-lg overflow-hidden"
          >
            <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Exportar CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary group relative w-full sm:w-auto justify-center flex items-center gap-2 px-6 py-3.5 gradient-primary text-white font-bold rounded-xl transition-all duration-300 shadow-premium hover:shadow-premium-colored overflow-hidden"
          >
            <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="glass rounded-2xl p-16 text-center shadow-premium animate-pulse">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-red-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-red-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-lg font-semibold text-gray-700">Carregando registros...</p>
          <p className="text-sm text-gray-500 mt-2">Aguarde um momento</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center shadow-premium animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <Filter className="w-12 h-12 text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-700 mb-2">Nenhum registro encontrado</p>
          <p className="text-gray-500 max-w-md mx-auto">
            Tente ajustar os filtros ou adicionar um novo registro
          </p>
        </div>
      ) : (
        <>
          {/* Tabela Desktop Premium */}
          <div className="hidden md:block glass rounded-2xl shadow-premium overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      🚗 Placa/Veículo
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      📅 Data/Hora Retirada
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      👤 Nome Retirada
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      📊 Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      🔄 Data/Hora Devolução
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      ⚙️ Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200">
                  {filteredRecords.map((record, index) => (
                    <tr 
                      key={record.id} 
                      className="group hover:bg-white/80 transition-all duration-200 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {record.vehicle_plate.substring(0, 2)}
                          </div>
                          <span className="font-bold text-gray-900">{record.vehicle_plate}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {new Date(record.pickup_date).toLocaleDateString('pt-BR')}
                        </div>
                        <div className="text-xs text-gray-500 font-medium">{record.pickup_time}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">
                        {record.pickup_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${
                            record.status === 'Em uso'
                              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                              : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.return_date ? (
                          <>
                            <div className="text-sm font-semibold text-gray-900">
                              {new Date(record.return_date).toLocaleDateString('pt-BR')}
                            </div>
                            <div className="text-xs text-gray-500 font-medium">{record.return_time}</div>
                          </>
                        ) : (
                          <span className="text-sm text-gray-400 font-medium">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsDetailsOpen(true);
                            }}
                            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:scale-110 transition-all duration-200 shadow-sm"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(record)}
                            className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 hover:scale-110 transition-all duration-200 shadow-sm"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(record.id)}
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:scale-110 transition-all duration-200 shadow-sm"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards Mobile Premium */}
          <div className="md:hidden space-y-4">
            {filteredRecords.map((record, index) => (
              <div 
                key={record.id} 
                className="glass card-shine rounded-2xl p-5 shadow-premium animate-fade-in interactive-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold shadow-lg">
                      {record.vehicle_plate.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">{record.vehicle_plate}</p>
                      <p className="text-sm text-gray-600 font-medium">{record.pickup_name}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${
                      record.status === 'Em uso'
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                        : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    {record.status}
                  </span>
                </div>
                
                <div className="space-y-2 mb-4 p-3 bg-white/50 rounded-xl">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-gray-700 min-w-[80px]">📤 Retirada:</span>
                    <span className="text-gray-900 font-medium">
                      {new Date(record.pickup_date).toLocaleDateString('pt-BR')} às {record.pickup_time}
                    </span>
                  </div>
                  {record.return_date && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-gray-700 min-w-[80px]">📥 Devolução:</span>
                      <span className="text-gray-900 font-medium">
                        {new Date(record.return_date).toLocaleDateString('pt-BR')} às {record.return_time}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      setSelectedRecord(record);
                      setIsDetailsOpen(true);
                    }}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 rounded-xl font-bold text-xs hover:shadow-lg transition-all duration-200"
                  >
                    <Eye className="w-5 h-5" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleEdit(record)}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 bg-gradient-to-br from-green-50 to-green-100 text-green-600 rounded-xl font-bold text-xs hover:shadow-lg transition-all duration-200"
                  >
                    <Edit className="w-5 h-5" />
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(record.id)}
                    className="flex flex-col items-center gap-1.5 px-3 py-3 bg-gradient-to-br from-red-50 to-red-100 text-red-600 rounded-xl font-bold text-xs hover:shadow-lg transition-all duration-200"
                  >
                    <Trash2 className="w-5 h-5" />
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <RecordDetails
        record={selectedRecord}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRecord(null);
        }}
      />

      <Modal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setRecordToEdit(null);
        }}
        title="Editar Registro"
        size="xl"
      >
        <VehicleForm
          editData={recordToEdit ? { ...recordToEdit, id: recordToEdit.id } : undefined}
          onSuccess={() => {
            onSuccess('Registro atualizado com sucesso');
            setIsEditOpen(false);
            setRecordToEdit(null);
            loadRecords();
          }}
          onError={onError}
        />
      </Modal>

      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="⚠️ Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-6">
          <div className="text-center p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
              <Trash2 className="w-8 h-8 text-white" />
            </div>
            <p className="text-lg font-bold text-gray-900 mb-2">Tem certeza?</p>
            <p className="text-gray-700 font-medium">Esta ação não pode ser desfeita.</p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-bold rounded-xl transition-all duration-200 shadow-sm hover:shadow-premium"
            >
              Cancelar
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="btn-primary flex-1 px-6 py-3.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl transition-all duration-200 shadow-premium hover:shadow-premium-colored overflow-hidden"
            >
              <span className="relative z-10">🗑️ Excluir</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
