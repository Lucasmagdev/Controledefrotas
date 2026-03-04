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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por placa/veículo ou nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="Todos">Todos</option>
              <option value="Em uso">Em uso</option>
              <option value="Devolvido">Devolvido</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Data inicial"
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Data final"
              className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl sm:text-3xl font-bold text-red-700">{stats.total}</div>
            <div className="text-sm text-red-700 mt-1">Total de Registros</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.inUse}</div>
            <div className="text-sm text-yellow-600 mt-1">Em Uso</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">{stats.returned}</div>
            <div className="text-sm text-green-600 mt-1">Devolvidos</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleExport}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-700 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando registros...</p>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <Filter className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Nenhum registro encontrado</p>
          <p className="text-gray-400 text-sm mt-2">
            Tente ajustar os filtros ou adicionar um novo registro
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Placa/Veículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora Retirada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome Retirada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data/Hora Devolução
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.vehicle_plate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(record.pickup_date).toLocaleDateString('pt-BR')}{' '}
                        {record.pickup_time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record.pickup_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            record.status === 'Em uso'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record.return_date
                          ? `${new Date(record.return_date).toLocaleDateString('pt-BR')} ${record.return_time}`
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsDetailsOpen(true);
                            }}
                            className="text-red-700 hover:text-red-800"
                            title="Ver detalhes"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(record)}
                            className="text-green-600 hover:text-green-800"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(record.id)}
                            className="text-red-600 hover:text-red-800"
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

          <div className="md:hidden space-y-4">
            {filteredRecords.map((record) => (
              <div key={record.id} className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{record.vehicle_plate}</p>
                    <p className="text-sm text-gray-600">{record.pickup_name}</p>
                  </div>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status === 'Em uso'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mb-3">
                  <p>
                    Retirada: {new Date(record.pickup_date).toLocaleDateString('pt-BR')}{' '}
                    {record.pickup_time}
                  </p>
                  {record.return_date && (
                    <p>
                      Devolução: {new Date(record.return_date).toLocaleDateString('pt-BR')}{' '}
                      {record.return_time}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedRecord(record);
                      setIsDetailsOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button
                    onClick={() => handleEdit(record)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(record.id)}
                    className="flex items-center justify-center px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
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
        title="Confirmar Exclusão"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Tem certeza que deseja excluir este registro?</p>
          <p className="text-sm text-red-600">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
