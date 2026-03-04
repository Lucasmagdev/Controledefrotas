import { useState } from 'react';
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Informações do Veículo
        </h3>

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

      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Retirada
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
          Devolução (Opcional)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 space-y-4">
        <Textarea
          label="Observações"
          value={formData.observations || ''}
          onChange={(e) => setFormData((prev) => ({ ...prev, observations: e.target.value }))}
          placeholder="Informações adicionais (opcional)"
          rows={3}
        />
      </div>

      <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
        <button
          type="button"
          onClick={handleClear}
          className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          disabled={isSubmitting}
        >
          Limpar Formulário
        </button>
        <button
          type="submit"
          className="w-full sm:w-auto px-6 py-3 sm:py-2.5 bg-red-700 hover:bg-red-800 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : editData?.id ? 'Atualizar Registro' : 'Salvar Registro'}
        </button>
      </div>
    </form>
  );
}
