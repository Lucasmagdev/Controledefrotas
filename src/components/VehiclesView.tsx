import { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import { Car, Search, Wrench, CheckCircle2, PauseCircle, Plus, Edit2, Trash2, ListFilter, QrCode, Download, Printer } from 'lucide-react';
import { Input } from './Input';
import { Modal } from './Modal';
import { vehicleCatalogService } from '../services/vehicleCatalogService';
import type { FleetVehicle, FleetVehicleInput, VehicleStatus } from '../types/database';

interface VehiclesViewProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const STATUS_OPTIONS: VehicleStatus[] = ['Ativo', 'Inativo', 'Em Manut.'];
const INITIAL_FORM: FleetVehicleInput = {
  plate: '',
  name: '',
  responsible_name: '',
  status: 'Ativo',
};

function getQrBaseUrl() {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  return (configuredUrl || window.location.origin).replace(/\/$/, '');
}

function getVehicleQrUrl(vehicle: FleetVehicle) {
  const url = new URL(getQrBaseUrl());
  url.searchParams.set('tab', 'patio');
  url.searchParams.set('veiculo', vehicle.short_code || vehicle.plate);
  return url.toString();
}

export function VehiclesView({ onSuccess, onError }: VehiclesViewProps) {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VehicleStatus | 'Todos'>('Todos');
  const [formData, setFormData] = useState<FleetVehicleInput>(INITIAL_FORM);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FleetVehicleInput, string>>>({});
  const [qrVehicle, setQrVehicle] = useState<FleetVehicle | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [qrGenerating, setQrGenerating] = useState(false);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const data = await vehicleCatalogService.listVehicles({ search, status: statusFilter });
      setVehicles(data);
    } catch (error) {
      console.error('Erro ao carregar veículos:', error);
      onError('Erro ao carregar veículos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [search, statusFilter]);

  const stats = useMemo(() => {
    const active = vehicles.filter((vehicle) => vehicle.status === 'Ativo').length;
    const inactive = vehicles.filter((vehicle) => vehicle.status === 'Inativo').length;
    const maintenance = vehicles.filter((vehicle) => vehicle.status === 'Em Manut.').length;

    return {
      total: vehicles.length,
      active,
      inactive,
      maintenance,
    };
  }, [vehicles]);

  const validate = () => {
    const newErrors: Partial<Record<keyof FleetVehicleInput, string>> = {};

    if (!formData.plate.trim()) {
      newErrors.plate = 'Informe a placa do veículo';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Informe o nome do veículo';
    }

    if (!formData.status) {
      newErrors.status = 'Selecione um status';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM);
    setErrors({});
    setEditingVehicleId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (editingVehicleId) {
        await vehicleCatalogService.updateVehicle(editingVehicleId, formData);
        onSuccess('Veículo atualizado com sucesso');
      } else {
        await vehicleCatalogService.createVehicle(formData);
        onSuccess('Veículo cadastrado com sucesso');
      }

      resetForm();
      await loadVehicles();
    } catch (error) {
      console.error('Erro ao salvar veículo:', error);
      const message =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message?: unknown }).message || '')
          : '';

      if (message.toLowerCase().includes('duplicate') || message.toLowerCase().includes('unique') || message.includes('23505')) {
        onError('Erro ao salvar veículo. Verifique se a placa já existe.');
      } else {
        onError('Erro ao salvar veículo. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (vehicle: FleetVehicle) => {
    setEditingVehicleId(vehicle.id);
    setFormData({
      plate: vehicle.plate,
      name: vehicle.name,
      responsible_name: vehicle.responsible_name,
      status: vehicle.status,
    });
    setErrors({});
  };

  const handleDelete = async (id: string) => {
    const confirmed = confirm('Deseja realmente excluir este veículo?');
    if (!confirmed) {
      return;
    }

    try {
      await vehicleCatalogService.deleteVehicle(id);
      onSuccess('Veículo excluído com sucesso');

      if (editingVehicleId === id) {
        resetForm();
      }

      await loadVehicles();
    } catch (error) {
      console.error('Erro ao excluir veículo:', error);
      onError('Erro ao excluir veículo');
    }
  };

  const openQrModal = async (vehicle: FleetVehicle) => {
    try {
      setQrVehicle(vehicle);
      setQrGenerating(true);
      setQrDataUrl('');

      const dataUrl = await QRCode.toDataURL(getVehicleQrUrl(vehicle), {
        width: 360,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#111827',
          light: '#ffffff',
        },
      });

      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      onError('Erro ao gerar QR Code do veÃ­culo');
    } finally {
      setQrGenerating(false);
    }
  };

  const downloadQr = () => {
    if (!qrVehicle || !qrDataUrl) return;

    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `qr-${qrVehicle.plate}-${qrVehicle.short_code || 'veiculo'}.png`;
    link.click();
  };

  const printQr = () => {
    if (!qrVehicle || !qrDataUrl) return;

    const printWindow = window.open('', '_blank', 'width=420,height=640');
    if (!printWindow) {
      onError('NÃ£o foi possÃ­vel abrir a janela de impressÃ£o');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>QR ${qrVehicle.plate}</title>
          <style>
            body { font-family: Arial, sans-serif; display: grid; min-height: 100vh; place-items: center; margin: 0; }
            .label { width: 320px; border: 2px solid #111827; border-radius: 18px; padding: 20px; text-align: center; }
            img { width: 240px; height: 240px; }
            h1 { margin: 10px 0 4px; font-size: 30px; }
            p { margin: 4px 0; color: #374151; }
            .code { font-size: 18px; font-weight: 700; color: #111827; }
          </style>
        </head>
        <body>
          <div class="label">
            <img src="${qrDataUrl}" alt="QR Code do veiculo" />
            <h1>${qrVehicle.plate}</h1>
            <p>${qrVehicle.name}</p>
            <p class="code">${qrVehicle.short_code || qrVehicle.plate}</p>
          </div>
          <script>window.onload = () => { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const statusStyle = (status: VehicleStatus) => {
    if (status === 'Ativo') {
      return 'bg-green-100 text-green-700';
    }

    if (status === 'Inativo') {
      return 'bg-gray-200 text-gray-700';
    }

    return 'bg-amber-100 text-amber-700';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-premium-colored">
          <Car className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestao de Veiculos</h2>
          <p className="text-gray-600">Cadastro e controle da frota da empresa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="glass rounded-2xl p-5 shadow-premium">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Total</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
        </div>
        <div className="glass rounded-2xl p-5 shadow-premium">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Ativos</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{stats.active}</p>
        </div>
        <div className="glass rounded-2xl p-5 shadow-premium">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Inativos</p>
          <p className="text-3xl font-bold text-gray-700 mt-2">{stats.inactive}</p>
        </div>
        <div className="glass rounded-2xl p-5 shadow-premium">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Em Manutencao</p>
          <p className="text-3xl font-bold text-amber-600 mt-2">{stats.maintenance}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <section className="xl:col-span-2 glass card-shine rounded-2xl p-6 shadow-premium">
          <div className="flex items-center gap-2 mb-5">
            <Plus className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-gray-900">
              {editingVehicleId ? 'Editar Veiculo' : 'Novo Veiculo'}
            </h3>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Placa"
              placeholder="ABC-1234"
              value={formData.plate}
              onChange={(event) => setFormData((prev) => ({ ...prev, plate: event.target.value.toUpperCase() }))}
              error={errors.plate}
              required
            />

            <Input
              label="Nome"
              placeholder="Ex: Fiat Strada 2024"
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              error={errors.name}
              required
            />

            <Input
              label="Responsável/Motorista"
              placeholder="Ex: João Silva"
              value={formData.responsible_name}
              onChange={(event) => setFormData((prev) => ({ ...prev, responsible_name: event.target.value }))}
            />

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Status</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, status }))}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold border transition-all ${
                      formData.status === status
                        ? 'gradient-primary text-white border-transparent shadow-premium-colored'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-red-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              {errors.status && <p className="text-sm text-red-600">{errors.status}</p>}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 gradient-primary text-white rounded-xl py-3 font-semibold shadow-premium-colored hover:opacity-95 disabled:opacity-60"
              >
                {isSubmitting ? 'Salvando...' : editingVehicleId ? 'Salvar alteracoes' : 'Cadastrar veiculo'}
              </button>
              {editingVehicleId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="xl:col-span-3 glass rounded-2xl p-6 shadow-premium">
          <div className="flex flex-col lg:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por placa ou nome"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-300 focus:ring-4 focus:ring-red-100 focus:border-red-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as VehicleStatus | 'Todos')}
                className="px-3 py-2.5 rounded-xl border border-gray-300 focus:ring-4 focus:ring-red-100 focus:border-red-500"
              >
                <option value="Todos">Todos</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-500">Carregando veiculos...</div>
          ) : vehicles.length === 0 ? (
            <div className="py-16 text-center">
              <Wrench className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Nenhum veiculo encontrado</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-premium transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      {vehicle.responsible_name && (
                        <p className="text-sm text-gray-500 mt-1">📋 {vehicle.responsible_name}</p>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-lg font-bold text-gray-900">{vehicle.plate}</h4>
                        <span className="rounded-full bg-gray-900 px-2.5 py-1 text-xs font-bold tracking-wider text-white">
                          Código {vehicle.short_code}
                        </span>
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusStyle(vehicle.status)}`}>
                          {vehicle.status}
                        </span>
                      </div>
                      <p className="text-gray-600 font-medium">{vehicle.name}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Cadastrado em {new Date(vehicle.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openQrModal(vehicle)}
                        className="p-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
                        title="Gerar QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(vehicle)}
                        className="p-2.5 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(vehicle.id)}
                        className="p-2.5 rounded-xl border border-red-200 text-red-700 hover:bg-red-50"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-500 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-600" /> Ativo</span>
            <span className="inline-flex items-center gap-1"><PauseCircle className="w-4 h-4 text-gray-600" /> Inativo</span>
            <span className="inline-flex items-center gap-1"><Wrench className="w-4 h-4 text-amber-600" /> Em Manut.</span>
          </div>
        </section>
      </div>

      <Modal
        isOpen={!!qrVehicle}
        onClose={() => setQrVehicle(null)}
        title="QR Code do veiculo"
        size="md"
      >
        {qrVehicle && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center">
              <p className="text-sm font-semibold text-gray-500">Etiqueta fixa do veiculo</p>
              <h3 className="mt-1 text-2xl font-bold text-gray-900">{qrVehicle.plate}</h3>
              <p className="text-gray-600">{qrVehicle.name}</p>
              <p className="mt-1 text-sm font-semibold text-gray-700">Codigo: {qrVehicle.short_code || qrVehicle.plate}</p>
            </div>

            <div className="flex justify-center rounded-2xl border border-gray-200 bg-white p-5">
              {qrGenerating ? (
                <div className="py-24 text-sm text-gray-500">Gerando QR Code...</div>
              ) : qrDataUrl ? (
                <img src={qrDataUrl} alt={`QR Code do veiculo ${qrVehicle.plate}`} className="h-64 w-64" />
              ) : (
                <div className="py-24 text-sm text-gray-500">QR indisponivel.</div>
              )}
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">Link permanente</p>
              <p className="mt-2 break-all text-sm text-blue-800">{getVehicleQrUrl(qrVehicle)}</p>
              <p className="mt-2 text-xs text-blue-700">
                Este QR usa o codigo curto do veiculo. Ele continua funcionando enquanto o veiculo existir no banco e o dominio do Netlify continuar o mesmo.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={downloadQr}
                disabled={!qrDataUrl}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-black disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                Baixar PNG
              </button>
              <button
                type="button"
                onClick={printQr}
                disabled={!qrDataUrl}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                <Printer className="w-4 h-4" />
                Imprimir etiqueta
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
