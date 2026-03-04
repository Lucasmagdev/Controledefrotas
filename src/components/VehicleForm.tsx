import { useState } from 'react';
import { Truck, LogOut, LogIn, FileText, Save, RotateCcw } from 'lucide-react';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { ChipSelect } from './ChipSelect';
import { SignaturePad } from './SignaturePad';
import { vehicleService } from '../services/vehicleService';
import type { VehicleRecordInput } from '../types/database';

interface VehicleFormProps {
  onSuccess: () => void;
  onError: (message: string) => void;
  editData?: VehicleRecordInput & { id?: string };
}

const REASON_SUGGESTIONS = ['Visita técnica', 'Entrega', 'Reunião', 'Manutenção', 'Outro'];
const AUTHORIZATION_SUGGESTIONS = ['Gestor', 'Diretoria', 'RH', 'Coordenação', 'Outro'];

export function VehicleForm({ onSuccess, onError, editData }: VehicleFormProps) {
  const [formData, setFormData] = useState<VehicleRecordInput>({
    vehicle_plate: editData?.vehicle_plate || '',
    reason: editData?.reason || '',
    authorized_by: editData?.authorized_by || '',
    pickup_date: editData?.pickup_date || '',
    pickup_time: editData?.pickup_time || '',
    pickup_name: editData?.pickup_name || '',
    pickup_signature: editData?.pickup_signature || '',
    return_date: editData?.return_date || '',
    return_time: editData?.return_time || '',
    return_name: editData?.return_name || '',
    return_signature: editData?.return_signature || '',
    observations: editData?.observations || '',
    status: editData?.status || 'Em uso',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizePlate = (plate: string) => {
    return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  };

  const formatPlate = (plate: string) => {
    const normalized = normalizePlate(plate);
    if (normalized.length <= 3) return normalized;
    if (normalized.length <= 7) {
      return `${normalized.slice(0, 3)}-${normalized.slice(3)}`;
    }
    return `${normalized.slice(0, 3)}-${normalized.slice(3, 7)}`;
  };

  const handlePlateChange = (value: string) => {
    const formatted = formatPlate(value);
    setFormData((prev) => ({ ...prev, vehicle_plate: formatted }));
    if (errors.vehicle_plate) {
      setErrors((prev) => ({ ...prev, vehicle_plate: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.vehicle_plate.trim()) {
      newErrors.vehicle_plate = 'Placa/veículo é obrigatório';
    }

    if (!formData.reason.trim()) {
      newErrors.reason = 'Motivo é obrigatório';
    }

    if (!formData.authorized_by.trim()) {
      newErrors.authorized_by = 'Autorização é obrigatória';
    }

    if (!formData.pickup_date) {
      newErrors.pickup_date = 'Data de retirada é obrigatória';
    }

    if (!formData.pickup_time) {
      newErrors.pickup_time = 'Hora de retirada é obrigatória';
    }

    if (!formData.pickup_name.trim()) {
      newErrors.pickup_name = 'Nome de retirada é obrigatório';
    }

    if (!formData.pickup_signature) {
      newErrors.pickup_signature = 'Assinatura de retirada é obrigatória';
    }

    const hasReturnData =
      formData.return_date ||
      formData.return_time ||
      formData.return_name ||
      formData.return_signature;

    if (hasReturnData) {
      if (!formData.return_date) {
        newErrors.return_date = 'Data de devolução é obrigatória quando há devolução';
      }
      if (!formData.return_time) {
        newErrors.return_time = 'Hora de devolução é obrigatória quando há devolução';
      }
      if (!formData.return_name?.trim()) {
        newErrors.return_name = 'Nome de devolução é obrigatório quando há devolução';
      }
      if (!formData.return_signature) {
        newErrors.return_signature = 'Assinatura de devolução é obrigatória quando há devolução';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      onError('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      const hasCompleteReturn =
        formData.return_date &&
        formData.return_time &&
        formData.return_name &&
        formData.return_signature;

      const dataToSave: VehicleRecordInput = {
        ...formData,
        status: hasCompleteReturn ? 'Devolvido' : 'Em uso',
        return_date: formData.return_date || undefined,
        return_time: formData.return_time || undefined,
        return_name: formData.return_name || undefined,
        return_signature: formData.return_signature || undefined,
      };

      console.log('📤 Enviando para Supabase:', {
        veiculo: dataToSave.vehicle_plate,
        pickup_signature_length: dataToSave.pickup_signature?.length || 0,
        return_signature_length: dataToSave.return_signature?.length || 0,
        tem_pickup_sig: !!dataToSave.pickup_signature,
        tem_return_sig: !!dataToSave.return_signature,
      });

      if (editData?.id) {
        await vehicleService.updateRecord(editData.id, dataToSave);
      } else {
        await vehicleService.createRecord(dataToSave);
      }

      console.log('✅ Registro salvo com sucesso!');
      onSuccess();
      handleClear();
    } catch (error) {
      console.error('Error saving record:', error);
      onError('Erro ao salvar registro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      vehicle_plate: '',
      reason: '',
      authorized_by: '',
      pickup_date: '',
      pickup_time: '',
      pickup_name: '',
      pickup_signature: '',
      return_date: '',
      return_time: '',
      return_name: '',
      return_signature: '',
      observations: '',
      status: 'Em uso',
    });
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {/* Card de Informações do Veículo */}
      <div className="glass card-shine rounded-2xl p-6 sm:p-8 space-y-6 shadow-premium animate-fade-in">
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200/50">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Informações do Veículo
            </h3>
            <p className="text-sm text-gray-500">Dados básicos do veículo</p>
          </div>
        </div>

        <Input
          label="Placa/Veículo"
          value={formData.vehicle_plate}
          onChange={(e) => handlePlateChange(e.target.value)}
          placeholder="ABC-1234 ou Nome/Modelo do Veículo"
          required
          error={errors.vehicle_plate}
        />

        <ChipSelect
          label="Motivo"
          value={formData.reason}
          onChange={(value) => {
            setFormData((prev) => ({ ...prev, reason: value }));
            if (errors.reason) setErrors((prev) => ({ ...prev, reason: '' }));
          }}
          suggestions={REASON_SUGGESTIONS}
          placeholder="Digite ou selecione o motivo"
          required
          error={errors.reason}
        />

        <ChipSelect
          label="Autorização"
          value={formData.authorized_by}
          onChange={(value) => {
            setFormData((prev) => ({ ...prev, authorized_by: value }));
            if (errors.authorized_by) setErrors((prev) => ({ ...prev, authorized_by: '' }));
          }}
          suggestions={AUTHORIZATION_SUGGESTIONS}
          placeholder="Digite ou selecione quem autorizou"
          required
          error={errors.authorized_by}
        />
      </div>

      {/* Card de Retirada */}
      <div className="glass card-shine rounded-2xl p-6 sm:p-8 space-y-6 shadow-premium animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200/50">
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Retirada
            </h3>
            <p className="text-sm text-gray-500">Informações de quem retirou</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Data"
            type="date"
            value={formData.pickup_date}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, pickup_date: e.target.value }));
              if (errors.pickup_date) setErrors((prev) => ({ ...prev, pickup_date: '' }));
            }}
            required
            error={errors.pickup_date}
          />

          <Input
            label="Hora"
            type="time"
            value={formData.pickup_time}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, pickup_time: e.target.value }));
              if (errors.pickup_time) setErrors((prev) => ({ ...prev, pickup_time: '' }));
            }}
            required
            error={errors.pickup_time}
          />
        </div>

        <Input
          label="Nome"
          value={formData.pickup_name}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, pickup_name: e.target.value }));
            if (errors.pickup_name) setErrors((prev) => ({ ...prev, pickup_name: '' }));
          }}
          placeholder="Nome completo de quem retirou"
          required
          error={errors.pickup_name}
        />

        <SignaturePad
          label="Assinatura"
          value={formData.pickup_signature}
          onChange={(signature) => {
            setFormData((prev) => ({ ...prev, pickup_signature: signature }));
            if (errors.pickup_signature) setErrors((prev) => ({ ...prev, pickup_signature: '' }));
          }}
          required
          error={errors.pickup_signature}
        />
      </div>

      {/* Card de Devolução */}
      <div className="glass card-shine rounded-2xl p-6 sm:p-8 space-y-6 shadow-premium animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200/50">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <LogIn className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Devolução
            </h3>
            <p className="text-sm text-gray-500">Opcional - preencha ao devolver</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Data"
            type="date"
            value={formData.return_date || ''}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, return_date: e.target.value }));
              if (errors.return_date) setErrors((prev) => ({ ...prev, return_date: '' }));
            }}
            error={errors.return_date}
          />

          <Input
            label="Hora"
            type="time"
            value={formData.return_time || ''}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, return_time: e.target.value }));
              if (errors.return_time) setErrors((prev) => ({ ...prev, return_time: '' }));
            }}
            error={errors.return_time}
          />
        </div>

        <Input
          label="Nome"
          value={formData.return_name || ''}
          onChange={(e) => {
            setFormData((prev) => ({ ...prev, return_name: e.target.value }));
            if (errors.return_name) setErrors((prev) => ({ ...prev, return_name: '' }));
          }}
          placeholder="Nome completo de quem devolveu"
          error={errors.return_name}
        />

        <SignaturePad
          label="Assinatura"
          value={formData.return_signature || ''}
          onChange={(signature) => {
            setFormData((prev) => ({ ...prev, return_signature: signature }));
            if (errors.return_signature) setErrors((prev) => ({ ...prev, return_signature: '' }));
          }}
          error={errors.return_signature}
        />
      </div>

      {/* Card de Observações */}
      <div className="glass card-shine rounded-2xl p-6 sm:p-8 shadow-premium animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <Textarea
          label="Observações"
          value={formData.observations || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, observations: e.target.value }))}
          placeholder="Informações adicionais (opcional)"
          rows={4}
          maxLength={500}
        />
      </div>

      {/* Botões de Ação */}
      <div className="flex flex-col-reverse sm:flex-row gap-4 sm:justify-end animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <button
          type="button"
          onClick={handleClear}
          className="group relative w-full sm:w-auto px-8 py-3.5 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          disabled={isSubmitting}
        >
          <RotateCcw className="w-5 h-5" />
          <span>Limpar Formulário</span>
        </button>
        <button
          type="submit"
          className="group relative w-full sm:w-auto px-8 py-3.5 gradient-primary text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>{editData?.id ? 'Atualizar Registro' : 'Salvar Registro'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
