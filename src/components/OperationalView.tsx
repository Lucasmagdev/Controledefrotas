import { useEffect, useMemo, useState } from 'react';
import type { Dispatch, FormEvent, ReactNode, SetStateAction } from 'react';
import {
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Edit2,
  ExternalLink,
  FileUp,
  Filter,
  Plus,
  Search,
  ShieldAlert,
  Timer,
  Save,
  Trash2,
  Truck,
  UserCheck,
  Users,
} from 'lucide-react';
import { Input } from './Input';
import { Modal } from './Modal';
import { Textarea } from './Textarea';
import { BarcodeScanner } from './BarcodeScanner';
import { vehicleCatalogService } from '../services/vehicleCatalogService';
import { vehicleService } from '../services/vehicleService';
import { operationalService } from '../services/operationalService';
import { formatDateBR, toDateInputValue } from '../utils/date';
import type {
  DriverInput,
  DriverRecord,
  FleetVehicle,
  FuelLevel,
  Json,
  OperationalMovement,
  OperationType,
  VehicleRecord,
} from '../types/database';

interface OperationalViewProps {
  initialVehicleLookup?: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

type OperationalTab = 'entrada' | 'saida' | 'motoristas' | 'timeline' | 'relatorios';
type DriverStatusFilter = 'Todos' | 'Ativos' | 'Inativos' | 'Regulares' | 'Vencendo' | 'Vencidas' | 'Pendentes';
type DriverSort = 'name' | 'validity' | 'movements';
type ChecklistItemState = { ok: boolean; note: string };
type ChecklistGroup = Record<string, ChecklistItemState>;
type TimelineEvent = {
  id: string;
  movement: OperationalMovement;
  kind: 'saida' | 'entrada';
  date: string;
  time: string;
  driverName: string;
};

const CHECKLIST_ITEMS = [
  { key: 'pneus', label: 'Pneus e estepe' },
  { key: 'luzes', label: 'Luzes e sinalização' },
  { key: 'vidros', label: 'Vidros e espelhos' },
  { key: 'limpeza', label: 'Limpeza geral' },
  { key: 'odometro', label: 'Odômetro conferido' },
  { key: 'avarias', label: 'Sem avarias aparentes' },
] as const;

const FUEL_OPTIONS: FuelLevel[] = ['Reserva', '1/4', '1/2', '3/4', 'Cheio'];
const OPERATION_OPTIONS: OperationType[] = ['Obras', 'Trajeto curto', 'Viagem'];
const VEHICLE_STATUS_OPTIONS = ['Ativo', 'Inativo', 'Em Manut.'] as const;

type PatioVehicleEditForm = {
  plate: string;
  name: string;
  responsible_name: string;
  fixed_driver_name: string;
  status: (typeof VEHICLE_STATUS_OPTIONS)[number];
  in_patio: boolean;
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeLookupValue(value: string) {
  return normalizeText(value).replace(/\s+/g, '');
}

function formatShortCode(value?: string | null) {
  return value?.trim() || '-----';
}

function extractLookupValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  try {
    const parsedUrl = new URL(trimmed, window.location.origin);
    return (
      parsedUrl.searchParams.get('veiculo') ||
      parsedUrl.searchParams.get('vehicle') ||
      parsedUrl.searchParams.get('codigo') ||
      parsedUrl.searchParams.get('code') ||
      parsedUrl.searchParams.get('qr') ||
      trimmed
    );
  } catch {
    return trimmed;
  }
}

function getCurrentTimeValue() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function createEntryFormDefaults() {
  return {
    operation_type: 'Obras' as OperationType,
    driver_id: '',
    entry_date: toDateInputValue(new Date()),
    entry_time: getCurrentTimeValue(),
    entry_odometer: '',
    entry_fuel_level: '1/2' as FuelLevel,
    entry_observations: '',
    qr_identifier: '',
  };
}

function createExitFormDefaults() {
  return {
    exit_date: toDateInputValue(new Date()),
    exit_time: getCurrentTimeValue(),
    exit_odometer: '',
    exit_fuel_level: '1/2' as FuelLevel,
    exit_observations: '',
  };
}

function getDaysUntil(dateValue?: string | null) {
  if (!dateValue) return null;
  const target = new Date(`${dateValue}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function isDriverCnhPending(driver: DriverRecord) {
  return !driver.cnh_file_url || !driver.cnh_valid_until;
}

function getDriverCnhStatus(driver: DriverRecord) {
  const daysLeft = getDaysUntil(driver.cnh_valid_until);
  if (isDriverCnhPending(driver)) return 'Pendente';
  if (daysLeft !== null && daysLeft < 0) return 'Vencida';
  if (daysLeft !== null && daysLeft <= 30) return 'Vencendo';
  return 'Regular';
}

function createChecklistState(): ChecklistGroup {
  return CHECKLIST_ITEMS.reduce<ChecklistGroup>((acc, item) => {
    acc[item.key] = { ok: false, note: '' };
    return acc;
  }, {});
}

function safeChecklistGroup(value: Json | undefined): ChecklistGroup {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createChecklistState();
  }

  const source = value as Record<string, unknown>;
  return CHECKLIST_ITEMS.reduce<ChecklistGroup>((acc, item) => {
    const raw = source[item.key] as { ok?: unknown; note?: unknown } | undefined;
    acc[item.key] = {
      ok: !!raw?.ok,
      note: typeof raw?.note === 'string' ? raw.note : '',
    };
    return acc;
  }, {});
}

function checklistCompletion(group: ChecklistGroup) {
  const total = CHECKLIST_ITEMS.length;
  const checked = CHECKLIST_ITEMS.filter((item) => group[item.key]?.ok).length;
  return { total, checked, percent: total ? Math.round((checked / total) * 100) : 0 };
}

function createMovementChecklistSnapshot(entry: ChecklistGroup, exit: ChecklistGroup): Json {
  return { entry, exit };
}

function getTimelineTimestamp(event: TimelineEvent) {
  return `${event.date}T${event.time || '00:00'}:00`;
}

function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }) {
  const tones = {
    neutral: 'bg-gray-100 text-gray-700 border-gray-200',
    success: 'bg-green-100 text-green-700 border-green-200',
    warning: 'bg-amber-100 text-amber-700 border-amber-200',
    danger: 'bg-red-100 text-red-700 border-red-200',
    info: 'bg-blue-100 text-blue-700 border-blue-200',
  } as const;

  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-max shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
        active ? 'bg-red-600 text-white shadow-md' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function OperationalView({ initialVehicleLookup = '', onSuccess, onError }: OperationalViewProps) {
  const [activeTab, setActiveTab] = useState<OperationalTab>('saida');
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [drivers, setDrivers] = useState<DriverRecord[]>([]);
  const [movements, setMovements] = useState<OperationalMovement[]>([]);
  const [historyRecords, setHistoryRecords] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [initialLookupHandled, setInitialLookupHandled] = useState(false);
  const [message, setMessage] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<FleetVehicle | null>(null);
  const [vehicleEditForm, setVehicleEditForm] = useState<PatioVehicleEditForm>({
    plate: '',
    name: '',
    responsible_name: '',
    fixed_driver_name: '',
    status: 'Ativo',
    in_patio: true,
  });
  const [vehicleEditErrors, setVehicleEditErrors] = useState<Partial<Record<keyof PatioVehicleEditForm, string>>>({});
  const [vehicleEditSaving, setVehicleEditSaving] = useState(false);

  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [entrySearch, setEntrySearch] = useState('');
  const [vehiclePickerSearch, setVehiclePickerSearch] = useState('');
  const [driverPickerSearch, setDriverPickerSearch] = useState('');
  const [entryChecklist, setEntryChecklist] = useState<ChecklistGroup>(createChecklistState());
  const [entryPhotos, setEntryPhotos] = useState<File[]>([]);
  const [entryForm, setEntryForm] = useState(() => createEntryFormDefaults());

  const [driverForm, setDriverForm] = useState<DriverInput>({
    name: '',
    cnh_number: '',
    cnh_valid_until: '',
    phone: '',
    notes: '',
    origin: 'manual',
    is_active: true,
  });
  const [driverSaving, setDriverSaving] = useState(false);
  const [driverDeletingId, setDriverDeletingId] = useState<string | null>(null);
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [driverCnhFile, setDriverCnhFile] = useState<File | null>(null);
  const [importingHistory, setImportingHistory] = useState(false);
  const [driverManagementSearch, setDriverManagementSearch] = useState('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<DriverStatusFilter>('Todos');
  const [driverSort, setDriverSort] = useState<DriverSort>('name');

  const [movementToClose, setMovementToClose] = useState<OperationalMovement | null>(null);
  const [returnDriverId, setReturnDriverId] = useState('');
  const [exitChecklist, setExitChecklist] = useState<ChecklistGroup>(createChecklistState());
  const [exitPhotos, setExitPhotos] = useState<File[]>([]);
  const [exitForm, setExitForm] = useState(() => createExitFormDefaults());
  const [movementSaving, setMovementSaving] = useState(false);

  const [reportStartDate, setReportStartDate] = useState(toDateInputValue(new Date()));
  const [reportEndDate, setReportEndDate] = useState(toDateInputValue(new Date()));

  const loadData = async () => {
    setLoading(true);
    setHasLoadedData(false);

    const [vehicleResult, driverResult, movementResult, historyResult] = await Promise.allSettled([
      vehicleCatalogService.listVehicles(),
      operationalService.listDrivers(),
      operationalService.listMovements(),
      vehicleService.listRecords(),
    ]);

    if (vehicleResult.status === 'fulfilled') {
      setVehicles(vehicleResult.value);
    } else {
      console.error('Erro ao carregar veículos para a aba operacional:', vehicleResult.reason);
      onError('Não foi possível carregar a lista de veículos');
    }

    if (driverResult.status === 'fulfilled') {
      setDrivers(driverResult.value);
    } else {
      console.error('Erro ao carregar motoristas para a aba operacional:', driverResult.reason);
      onError('Não foi possível carregar a lista de motoristas');
    }

    if (movementResult.status === 'fulfilled') {
      setMovements(movementResult.value);
    } else {
      console.error('Erro ao carregar movimentações operacionais:', movementResult.reason);
    }

    if (historyResult.status === 'fulfilled') {
      setHistoryRecords(historyResult.value);
    } else {
      console.error('Erro ao carregar histórico de retiradas:', historyResult.reason);
    }

    setLoading(false);
    setHasLoadedData(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openMovements = useMemo(
    () => movements.filter((movement) => movement.status === 'Em aberto'),
    [movements]
  );

  const openVehicleIds = useMemo(
    () => new Set(openMovements.map((movement) => movement.vehicle_id)),
    [openMovements]
  );

  // Disponibilidade ao vivo: placa indisponível = tem movimentação operacional
  // "Em aberto" OU registro de retirada "Em uso". Fonte confiável, não depende da
  // flag in_patio (que pode desincronizar). Mesma regra do picker de retirada.
  const unavailableVehiclePlates = useMemo(() => {
    const plates = new Set<string>();
    openMovements.forEach((movement) => {
      if (movement.vehicle_plate) plates.add(normalizeLookupValue(movement.vehicle_plate));
    });
    historyRecords.forEach((record) => {
      if (record.status === 'Em uso' && record.vehicle_plate) {
        plates.add(normalizeLookupValue(record.vehicle_plate));
      }
    });
    return plates;
  }, [openMovements, historyRecords]);

  const vehiclesInPatio = useMemo(
    () =>
      vehicles.filter(
        (vehicle) =>
          vehicle.status === 'Ativo' &&
          !vehicle.fixed_driver_name?.trim() &&
          !unavailableVehiclePlates.has(normalizeLookupValue(vehicle.plate))
      ),
    [vehicles, unavailableVehiclePlates]
  );

  const filteredVehiclesInPatio = useMemo(() => {
    const search = normalizeLookupValue(vehiclePickerSearch);
    if (!search) return vehiclesInPatio;

    return vehiclesInPatio.filter((vehicle) =>
      [vehicle.short_code, vehicle.legacy_short_code || '', vehicle.plate, vehicle.name].some((value) =>
        normalizeLookupValue(value).includes(search)
      )
    );
  }, [vehiclesInPatio, vehiclePickerSearch]);

  const selectedVehicle = useMemo(
    () => vehiclesInPatio.find((vehicle) => vehicle.id === selectedVehicleId) || null,
    [vehiclesInPatio, selectedVehicleId]
  );

  const activeDrivers = useMemo(
    () => drivers.filter((driver) => driver.is_active),
    [drivers]
  );

  const filteredActiveDrivers = useMemo(() => {
    const search = normalizeLookupValue(driverPickerSearch);
    if (!search) return activeDrivers;

    return activeDrivers.filter((driver) =>
      [driver.short_code, driver.name, driver.cnh_number || ''].some((value) => normalizeLookupValue(value).includes(search))
    );
  }, [activeDrivers, driverPickerSearch]);

  const selectedDriver = useMemo(
    () => drivers.find((driver) => driver.id === entryForm.driver_id) || null,
    [drivers, entryForm.driver_id]
  );

  const selectedReturnDriver = useMemo(
    () => drivers.find((driver) => driver.id === returnDriverId) || null,
    [drivers, returnDriverId]
  );

  const entryChecklistProgress = useMemo(
    () => checklistCompletion(entryChecklist),
    [entryChecklist]
  );

  const exitChecklistProgress = useMemo(
    () => checklistCompletion(exitChecklist),
    [exitChecklist]
  );

  const vehiclesInWork = useMemo(
    () => openMovements.filter((movement) => movement.operation_type === 'Obras'),
    [openMovements]
  );

  const expiringDrivers = useMemo(
    () =>
      drivers
        .map((driver) => ({
          ...driver,
          daysLeft: getDaysUntil(driver.cnh_valid_until),
        }))
        .filter((driver) => isDriverCnhPending(driver) || (driver.daysLeft !== null && driver.daysLeft <= 30))
        .sort((a, b) => (a.daysLeft ?? 9999) - (b.daysLeft ?? 9999)),
    [drivers]
  );

  const driverMovementStats = useMemo(() => {
    const stats = new Map<string, { count: number; lastDate: string | null }>();
    movements.forEach((movement) => {
      if (!movement.driver_id) return;
      const current = stats.get(movement.driver_id) || { count: 0, lastDate: null };
      const movementDate = movement.exit_date || movement.entry_date;
      stats.set(movement.driver_id, {
        count: current.count + 1,
        lastDate: !current.lastDate || movementDate > current.lastDate ? movementDate : current.lastDate,
      });
    });
    return stats;
  }, [movements]);

  const driverSummary = useMemo(
    () => ({
      total: drivers.length,
      active: drivers.filter((driver) => driver.is_active).length,
      regular: drivers.filter((driver) => getDriverCnhStatus(driver) === 'Regular').length,
      attention: drivers.filter((driver) => ['Vencendo', 'Vencida', 'Pendente'].includes(getDriverCnhStatus(driver))).length,
    }),
    [drivers]
  );

  const managedDrivers = useMemo(() => {
    const search = normalizeLookupValue(driverManagementSearch);
    return drivers
      .filter((driver) => {
        const status = getDriverCnhStatus(driver);
        const matchesSearch =
          !search ||
          [driver.name, driver.short_code, driver.cnh_number || '', driver.phone || ''].some((value) =>
            normalizeLookupValue(value).includes(search)
          );
        const matchesStatus =
          driverStatusFilter === 'Todos' ||
          (driverStatusFilter === 'Ativos' && driver.is_active) ||
          (driverStatusFilter === 'Inativos' && !driver.is_active) ||
          (driverStatusFilter === 'Regulares' && status === 'Regular') ||
          (driverStatusFilter === 'Vencendo' && status === 'Vencendo') ||
          (driverStatusFilter === 'Vencidas' && status === 'Vencida') ||
          (driverStatusFilter === 'Pendentes' && status === 'Pendente');
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (driverSort === 'validity') {
          return (a.cnh_valid_until || '9999-12-31').localeCompare(b.cnh_valid_until || '9999-12-31');
        }
        if (driverSort === 'movements') {
          return (driverMovementStats.get(b.id)?.count || 0) - (driverMovementStats.get(a.id)?.count || 0);
        }
        return a.name.localeCompare(b.name, 'pt-BR');
      });
  }, [driverManagementSearch, driverMovementStats, driverSort, driverStatusFilter, drivers]);

  const filteredMovements = useMemo(() => {
    const start = reportStartDate ? `${reportStartDate}T00:00:00` : null;
    const end = reportEndDate ? `${reportEndDate}T23:59:59` : null;

    return movements.filter((movement) => {
      const entryDate = `${movement.entry_date}T00:00:00`;
      if (start && entryDate < start) return false;
      if (end && entryDate > end) return false;
      return true;
    });
  }, [movements, reportStartDate, reportEndDate]);

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events = movements.flatMap((movement) => {
      const movementEvents: TimelineEvent[] = [
        {
          id: `${movement.id}-saida`,
          movement,
          kind: 'saida',
          date: movement.entry_date,
          time: movement.entry_time,
          driverName: movement.driver_name || 'Não informado',
        },
      ];

      if (movement.exit_date && movement.exit_time) {
        movementEvents.push({
          id: `${movement.id}-entrada`,
          movement,
          kind: 'entrada',
          date: movement.exit_date,
          time: movement.exit_time,
          driverName: movement.driver_name || 'Não informado',
        });
      }

      return movementEvents;
    });

    return events.sort((a, b) => getTimelineTimestamp(b).localeCompare(getTimelineTimestamp(a)));
  }, [movements]);

  const historyNames = useMemo(() => {
    const map = new Map<string, string>();
    historyRecords.forEach((record) => {
      const cleaned = record.pickup_name?.trim();
      if (!cleaned) return;
      const key = normalizeLookupValue(cleaned);
      if (!map.has(key)) {
        map.set(key, cleaned);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b));
  }, [historyRecords]);

  const lookupVehicleOrMovement = (value: string) => {
    const lookupValue = extractLookupValue(value);
    const normalized = normalizeLookupValue(lookupValue);
    if (!normalized) {
      onError('Digite uma placa, código ou QR válido');
      return;
    }

    const findMovementMatch = () =>
      movements.find((movement) => {
        const candidates = [
          movement.short_code,
          movement.id,
          movement.vehicle_id,
          movement.vehicle_plate,
          movement.qr_identifier || '',
        ].map(normalizeLookupValue);
        return candidates.includes(normalized);
      });

    const findVehicleMatch = () =>
      vehicles.find((vehicle) =>
        [vehicle.short_code, vehicle.legacy_short_code || '', vehicle.id, vehicle.plate]
          .map(normalizeLookupValue)
          .includes(normalized)
      );

    const preferredMatch = activeTab === 'entrada' ? findMovementMatch() || findVehicleMatch() : findVehicleMatch() || findMovementMatch();

    if (preferredMatch && 'vehicle_plate' in preferredMatch) {
      const movementMatch = preferredMatch as OperationalMovement;
      if (movementMatch.status === 'Em aberto') {
        openExitModal(movementMatch);
        setActiveTab('entrada');
        setMessage(`Movimentação aberta localizada para o código ${formatShortCode(movementMatch.short_code)}`);
      } else {
        setMessage(`Movimentação concluída localizada para o código ${formatShortCode(movementMatch.short_code)}`);
      }
      return;
    }

    const vehicleMatch = preferredMatch as FleetVehicle | undefined;
    if (!vehicleMatch) {
      onError('Nenhum veículo encontrado com esse código');
      return;
    }

    if (vehicleMatch.status !== 'Ativo') {
      onError('Esse veÃ­culo nÃ£o estÃ¡ ativo para checklist operacional');
      return;
    }

    if (unavailableVehiclePlates.has(normalizeLookupValue(vehicleMatch.plate)) || openVehicleIds.has(vehicleMatch.id)) {
      const openMovement = openMovements.find((movement) => movement.vehicle_id === vehicleMatch.id || movement.vehicle_plate === vehicleMatch.plate);
      if (openMovement) {
        openExitModal(openMovement);
        setActiveTab('entrada');
        setMessage(`VeÃ­culo fora do pÃ¡tio: abrindo checklist de entrada para ${vehicleMatch.plate}`);
        return;
      }

      onError('Esse veÃ­culo estÃ¡ marcado fora do pÃ¡tio, mas nÃ£o encontramos uma movimentaÃ§Ã£o em aberto');
      return;
    }

    setActiveTab('saida');
    setSelectedVehicleId(vehicleMatch.id);
    setEntryForm((prev) => ({ ...prev, qr_identifier: vehicleMatch.short_code || lookupValue }));
    setEntrySearch(vehicleMatch.short_code || vehicleMatch.plate);
    setMessage(`Veículo localizado: ${formatShortCode(vehicleMatch.short_code)} - ${vehicleMatch.plate} - ${vehicleMatch.name}`);
  };

  useEffect(() => {
    if (!initialVehicleLookup || !hasLoadedData || initialLookupHandled) return;

    setInitialLookupHandled(true);
    lookupVehicleOrMovement(initialVehicleLookup);
  }, [hasLoadedData, initialLookupHandled, initialVehicleLookup, movements, vehicles]);

  const openExitModal = (movement: OperationalMovement) => {
    setMovementToClose(movement);
    setReturnDriverId(movement.driver_id || '');
    setExitChecklist(safeChecklistGroup((movement.checklist as Record<string, Json> | undefined)?.entry));
    setExitForm(createExitFormDefaults());
    setExitPhotos([]);
  };

  const openVehicleEditModal = (vehicle: FleetVehicle) => {
    setVehicleToEdit(vehicle);
    setVehicleEditForm({
      plate: vehicle.plate,
      name: vehicle.name,
      responsible_name: vehicle.responsible_name || '',
      fixed_driver_name: vehicle.fixed_driver_name || '',
      status: vehicle.status,
      in_patio: vehicle.in_patio,
    });
    setVehicleEditErrors({});
  };

  const closeVehicleEditModal = () => {
    setVehicleToEdit(null);
    setVehicleEditErrors({});
    setVehicleEditSaving(false);
  };

  const validateVehicleEditForm = () => {
    const errors: Partial<Record<keyof PatioVehicleEditForm, string>> = {};

    if (!vehicleEditForm.plate.trim()) {
      errors.plate = 'Informe a placa do veículo';
    }

    if (!vehicleEditForm.name.trim()) {
      errors.name = 'Informe o nome do veículo';
    }

    if (!vehicleEditForm.status) {
      errors.status = 'Selecione um status';
    }

    setVehicleEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleVehicleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!vehicleToEdit) {
      return;
    }

    if (!validateVehicleEditForm()) {
      onError('Preencha os campos obrigatórios do veículo');
      return;
    }

    try {
      setVehicleEditSaving(true);

      await vehicleCatalogService.updateVehicle(vehicleToEdit.id, {
        plate: vehicleEditForm.plate,
        name: vehicleEditForm.name,
        responsible_name: vehicleEditForm.responsible_name,
        fixed_driver_name: vehicleEditForm.fixed_driver_name,
        status: vehicleEditForm.status,
      });

      await vehicleCatalogService.updatePatioStatus(vehicleToEdit.id, vehicleEditForm.in_patio);

      onSuccess('Veículo atualizado com sucesso');
      closeVehicleEditModal();
      await loadData();
    } catch (error) {
      console.error('Erro ao atualizar veículo do pátio:', error);
      onError('Erro ao salvar alterações do veículo');
    } finally {
      setVehicleEditSaving(false);
    }
  };

  const resetEntryForm = () => {
    setSelectedVehicleId('');
    setEntrySearch('');
    setVehiclePickerSearch('');
    setDriverPickerSearch('');
    setEntryChecklist(createChecklistState());
    setEntryPhotos([]);
    setEntryForm(createEntryFormDefaults());
  };

  const handleEntrySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedVehicle) {
      onError('Selecione um veículo antes de registrar a saída');
      return;
    }

    if (unavailableVehiclePlates.has(normalizeLookupValue(selectedVehicle.plate))) {
      onError('Esse veículo já está fora do pátio. Registre a entrada para liberá-lo novamente.');
      return;
    }

    if (openVehicleIds.has(selectedVehicle.id)) {
      onError('Esse veículo já está com checklist em aberto');
      return;
    }

    if (entryChecklistProgress.checked !== entryChecklistProgress.total) {
      onError('Marque todos os itens do checklist de saída antes de enviar');
      return;
    }

    const entryOdometer = Number(entryForm.entry_odometer);
    if (Number.isNaN(entryOdometer) || entryOdometer < 0) {
      onError('Informe um odômetro de saída válido');
      return;
    }

    if (!entryForm.entry_fuel_level) {
      onError('Informe o nível de combustível na saída');
      return;
    }

    try {
      setMovementSaving(true);
      await operationalService.createMovement(
        {
          vehicle_id: selectedVehicle.id,
          vehicle_plate: selectedVehicle.plate,
          operation_type: entryForm.operation_type,
          driver_id: selectedDriver?.id || null,
          driver_name: selectedDriver?.name || 'Não informado',
          driver_cnh_number: selectedDriver?.cnh_number?.trim() || null,
          driver_cnh_valid_until: selectedDriver?.cnh_valid_until || null,
          qr_identifier: entryForm.qr_identifier || selectedVehicle.short_code || selectedVehicle.id,
          entry_date: entryForm.entry_date,
          entry_time: entryForm.entry_time,
          entry_odometer: entryOdometer,
          entry_fuel_level: entryForm.entry_fuel_level,
          entry_observations: entryForm.entry_observations,
          checklist: createMovementChecklistSnapshot(createChecklistState(), entryChecklist),
        },
        entryPhotos
      );

      onSuccess('Checklist de saída salvo com sucesso');
      resetEntryForm();
      await loadData();
    } catch (error) {
      console.error('Erro ao criar movimentação:', error);
      onError('Erro ao salvar checklist de saída');
    } finally {
      setMovementSaving(false);
    }
  };

  const handleDriverSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!driverForm.name.trim()) {
      onError('Informe o nome do motorista');
      return;
    }

    try {
      setDriverSaving(true);
      const existingDriver = editingDriverId
        ? drivers.find((driver) => driver.id === editingDriverId) || null
        : null;
      let savedDriver = existingDriver
        ? await operationalService.updateDriver(existingDriver.id, driverForm)
        : await operationalService.createDriver(driverForm);

      if (!existingDriver) {
        setEditingDriverId(savedDriver.id);
      }

      if (driverCnhFile) {
        savedDriver = await operationalService.uploadDriverCnh(savedDriver, driverCnhFile);
      }

      onSuccess(existingDriver ? 'Motorista atualizado com sucesso' : 'Motorista cadastrado com sucesso');
      setEditingDriverId(null);
      setDriverCnhFile(null);
      setDriverForm({
        name: '',
        cnh_number: '',
        cnh_valid_until: '',
        phone: '',
        notes: '',
        origin: 'manual',
        is_active: true,
      });
      await loadData();
    } catch (error) {
      console.error('Erro ao salvar motorista:', error);
      onError('Erro ao salvar motorista ou anexo da CNH');
    } finally {
      setDriverSaving(false);
    }
  };

  const handleDriverEdit = (driver: DriverRecord) => {
    setEditingDriverId(driver.id);
    setDriverCnhFile(null);
    setDriverForm({
      name: driver.name,
      cnh_number: driver.cnh_number || '',
      cnh_valid_until: driver.cnh_valid_until || '',
      phone: driver.phone || '',
      notes: driver.notes || '',
      origin: driver.origin,
      is_active: driver.is_active,
    });
  };

  const cancelDriverEdit = () => {
    setEditingDriverId(null);
    setDriverCnhFile(null);
    setDriverForm({
      name: '',
      cnh_number: '',
      cnh_valid_until: '',
      phone: '',
      notes: '',
      origin: 'manual',
      is_active: true,
    });
  };

  const handleDriverDelete = async (id: string) => {
    const confirmed = confirm('Deseja realmente excluir este motorista?');
    if (!confirmed) return;

    try {
      setDriverDeletingId(id);
      await operationalService.deleteDriver(id);
      onSuccess('Motorista excluído com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro ao excluir motorista:', error);
      onError('Erro ao excluir motorista');
    } finally {
      setDriverDeletingId(null);
    }
  };

  const handleImportHistoricalDrivers = async () => {
    try {
      setImportingHistory(true);
      const existing = new Set(drivers.map((driver) => normalizeLookupValue(driver.name)));
      const missingNames = historyNames.filter((name) => !existing.has(normalizeLookupValue(name)));

      if (missingNames.length === 0) {
        onSuccess('Nenhum nome novo encontrado no histórico');
        return;
      }

      const created = await Promise.all(
        missingNames.map((name) =>
          operationalService.createDriver({
            name,
            cnh_number: null,
            cnh_valid_until: null,
            phone: '',
            notes: 'Importado do histórico de retiradas',
            origin: 'historico',
            is_active: true,
          })
        )
      );

      onSuccess(`${created.length} motorista(s) importado(s) do histórico`);
      await loadData();
    } catch (error) {
      console.error('Erro ao importar histórico:', error);
      onError('Erro ao importar nomes do histórico');
    } finally {
      setImportingHistory(false);
    }
  };

  const handleExitSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!movementToClose) return;

    const driverChanged = (returnDriverId || '') !== (movementToClose.driver_id || '');
    if (driverChanged) {
      const driverName = selectedReturnDriver?.name || 'Não informado';
      const confirmed = confirm(`Tem certeza que deseja alterar o motorista de "${movementToClose.driver_name}" para "${driverName}"?`);
      if (!confirmed) return;
    }

    if (exitChecklistProgress.checked !== exitChecklistProgress.total) {
      onError('Marque todos os itens do checklist de entrada antes de enviar');
      return;
    }

    const exitOdometer = Number(exitForm.exit_odometer);
    if (Number.isNaN(exitOdometer) || exitOdometer < 0) {
      onError('Informe um odômetro de entrada válido');
      return;
    }

    if (!exitForm.exit_fuel_level) {
      onError('Informe o nível de combustível na entrada');
      return;
    }

    try {
      setMovementSaving(true);
      await operationalService.closeMovement(
        movementToClose.id,
        {
          driver_id: selectedReturnDriver?.id || null,
          driver_name: selectedReturnDriver?.name || 'Não informado',
          driver_cnh_number: selectedReturnDriver?.cnh_number?.trim() || null,
          driver_cnh_valid_until: selectedReturnDriver?.cnh_valid_until || null,
          exit_date: exitForm.exit_date,
          exit_time: exitForm.exit_time,
          exit_odometer: exitOdometer,
          exit_fuel_level: exitForm.exit_fuel_level,
          exit_observations: exitForm.exit_observations,
          checklist: createMovementChecklistSnapshot(
            exitChecklist,
            safeChecklistGroup((movementToClose.checklist as Record<string, Json> | undefined)?.exit)
          ),
        },
        exitPhotos
      );

      onSuccess('Checklist de entrada salvo com sucesso');
      setMovementToClose(null);
      setReturnDriverId('');
      setExitChecklist(createChecklistState());
      setExitPhotos([]);
      await loadData();
    } catch (error) {
      console.error('Erro ao fechar movimentação:', error);
      onError('Erro ao salvar checklist de entrada');
    } finally {
      setMovementSaving(false);
    }
  };

  const updateChecklist = (
    setter: Dispatch<SetStateAction<ChecklistGroup>>,
    key: string,
    patch: Partial<ChecklistItemState>
  ) => {
    setter((current) => ({
      ...current,
      [key]: { ...current[key], ...patch },
    }));
  };

  const renderChecklist = (group: ChecklistGroup, setter: Dispatch<SetStateAction<ChecklistGroup>>) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {CHECKLIST_ITEMS.map((item) => (
        <div key={item.key} className="rounded-2xl border border-gray-200 bg-gray-50 p-3 space-y-2">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={group[item.key]?.ok || false}
              onChange={(event) => updateChecklist(setter, item.key, { ok: event.target.checked })}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-medium text-gray-800">{item.label}</span>
          </label>
          <input
            value={group[item.key]?.note || ''}
            onChange={(event) => updateChecklist(setter, item.key, { note: event.target.value })}
            placeholder="Observação"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm"
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h2 className="text-xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2 leading-tight">
          <ClipboardCheck className="w-6 h-6 sm:w-7 sm:h-7 text-red-600" />
          Operacional de Pátio e Checklist
        </h2>
        <p className="text-sm sm:text-base text-gray-600">
          Entrada, saída, motoristas e relatórios em subabas separadas.
        </p>
      </div>

      {message && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {message}
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
          Carregando veículos, motoristas e movimentações...
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-3 xl:grid-cols-4 xl:overflow-visible">
        <div className="glass min-w-[116px] rounded-xl sm:min-w-0 sm:rounded-2xl p-3 sm:p-5 shadow-premium">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Em aberto</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-red-600">{openMovements.length}</p>
        </div>
        <div className="glass min-w-[116px] rounded-xl sm:min-w-0 sm:rounded-2xl p-3 sm:p-5 shadow-premium">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">No pátio</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-green-600">{vehiclesInPatio.length}</p>
        </div>
        <div className="glass min-w-[116px] rounded-xl sm:min-w-0 sm:rounded-2xl p-3 sm:p-5 shadow-premium">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">Em obra</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-amber-600">{vehiclesInWork.length}</p>
        </div>
        <div className="glass min-w-[116px] rounded-xl sm:min-w-0 sm:rounded-2xl p-3 sm:p-5 shadow-premium">
          <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold">CNH pendente</p>
          <p className="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-blue-600">
            {drivers.filter(isDriverCnhPending).length}
          </p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 xl:grid xl:grid-cols-5 xl:gap-3 xl:overflow-visible">
        <TabButton
          active={activeTab === 'entrada'}
          onClick={() => setActiveTab('entrada')}
          icon={<ClipboardCheck className="w-4 h-4" />}
          label="Checklist de entrada"
        />
        <TabButton
          active={activeTab === 'saida'}
          onClick={() => setActiveTab('saida')}
          icon={<Plus className="w-4 h-4" />}
          label="Checklist de saída"
        />
        <TabButton
          active={activeTab === 'motoristas'}
          onClick={() => setActiveTab('motoristas')}
          icon={<Users className="w-4 h-4" />}
          label="Motoristas"
        />
        <TabButton
          active={activeTab === 'timeline'}
          onClick={() => setActiveTab('timeline')}
          icon={<Timer className="w-4 h-4" />}
          label="Timeline"
        />
        <TabButton
          active={activeTab === 'relatorios'}
          onClick={() => setActiveTab('relatorios')}
          icon={<CalendarDays className="w-4 h-4" />}
          label="Relatórios"
        />
      </div>

      {activeTab === 'saida' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <section className="xl:col-span-2 glass rounded-2xl p-4 sm:p-6 shadow-premium">
            <div className="mb-5 flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Checklist de saída</h3>
            </div>

            <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-red-100 bg-red-50 p-3 text-center text-xs font-semibold text-red-800 sm:hidden">
              <span>1. Veículo</span>
              <span>2. Motorista</span>
              <span>3. Checklist</span>
            </div>

            <form onSubmit={handleEntrySubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <button
                      type="button"
                      onClick={() => setScannerOpen((prev) => !prev)}
                      className="rounded-xl border border-gray-300 px-3 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 sm:px-4"
                    >
                      {scannerOpen ? 'Fechar câmera' : 'Abrir câmera'}
                    </button>
                    <button
                      type="button"
                      onClick={() => lookupVehicleOrMovement(entrySearch)}
                      className="rounded-xl bg-gray-900 px-3 py-3 text-sm font-semibold text-white hover:bg-black sm:px-4"
                    >
                      Localizar
                    </button>
                  </div>

                  <Input
                    label="Buscar veículo"
                    value={entrySearch}
                    onChange={(event) => setEntrySearch(event.target.value)}
                    placeholder="Código de 3 dígitos, placa ou QR"
                  />

                  <BarcodeScanner
                    open={scannerOpen}
                    onClose={() => setScannerOpen(false)}
                    onDetected={(value) => {
                      lookupVehicleOrMovement(value);
                      setScannerOpen(false);
                    }}
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Veículo</label>
                    <input
                      value={vehiclePickerSearch}
                      onChange={(event) => setVehiclePickerSearch(event.target.value)}
                      placeholder="Digite placa, código ou nome"
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                    <select
                      value={selectedVehicleId}
                      onChange={(event) => setSelectedVehicleId(event.target.value)}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    >
                      <option value="">Selecione um veículo disponível no pátio...</option>
                      {filteredVehiclesInPatio.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {formatShortCode(vehicle.short_code)} - {vehicle.plate} - {vehicle.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      A lista traz apenas veículos disponíveis no pátio. O motorista pode ser trocado sem alterar o veículo.
                    </p>
                    {selectedVehicle && (
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                        <div className="font-semibold text-gray-900">{selectedVehicle.plate}</div>
                        <div>{selectedVehicle.name}</div>
                        <div className="text-xs text-gray-500">Código: {formatShortCode(selectedVehicle.short_code)}</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">Motorista</label>
                    <input
                      value={driverPickerSearch}
                      onChange={(event) => setDriverPickerSearch(event.target.value)}
                      placeholder="Digite nome, código ou CNH"
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    />
                    <select
                      value={entryForm.driver_id}
                      onChange={(event) => setEntryForm((prev) => ({ ...prev, driver_id: event.target.value }))}
                      className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    >
                      <option value="">Selecione um motorista...</option>
                      {filteredActiveDrivers
                        .map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {formatShortCode(driver.short_code)} - {driver.name}
                            {driver.cnh_number ? ` - CNH ${driver.cnh_number}` : ' - número não informado'}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      O motorista é apenas uma informação da operação e pode ser alterado sem mudar o veículo.
                    </p>
                    {selectedDriver ? (
                      <p className="text-xs text-gray-500">
                        {selectedDriver.cnh_number ? `CNH ${selectedDriver.cnh_number}` : 'Número da CNH não informado'}
                        {' | '}
                        {selectedDriver.cnh_valid_until ? `válida até ${formatDateBR(selectedDriver.cnh_valid_until)}` : 'sem validade informada'}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-700">Nenhum motorista selecionado. Você pode escolher ou trocar antes de salvar.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Tipo de operação</label>
                      <select
                        value={entryForm.operation_type}
                        onChange={(event) =>
                          setEntryForm((prev) => ({ ...prev, operation_type: event.target.value as OperationType }))
                        }
                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                      >
                        {OPERATION_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">Combustível *</label>
                      <select
                        value={entryForm.entry_fuel_level}
                        onChange={(event) =>
                          setEntryForm((prev) => ({ ...prev, entry_fuel_level: event.target.value as FuelLevel }))
                        }
                        className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                      >
                        {FUEL_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Data de saída"
                      type="date"
                      value={entryForm.entry_date}
                      onChange={(event) => setEntryForm((prev) => ({ ...prev, entry_date: event.target.value }))}
                    />
                    <Input
                      label="Hora de saída"
                      type="time"
                      value={entryForm.entry_time}
                      onChange={(event) => setEntryForm((prev) => ({ ...prev, entry_time: event.target.value }))}
                    />
                  </div>

                  <Input
                    label="Odômetro de saída"
                    type="number"
                    min="0"
                    value={entryForm.entry_odometer}
                    onChange={(event) => setEntryForm((prev) => ({ ...prev, entry_odometer: event.target.value }))}
                    placeholder="Ex: 125430"
                  />

                  <Textarea
                    label="Observações de saída"
                    value={entryForm.entry_observations}
                    onChange={(event) => setEntryForm((prev) => ({ ...prev, entry_observations: event.target.value }))}
                    placeholder="Observações da saída"
                    rows={4}
                  />
                </div>

                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-semibold text-gray-900">Checklist de saída</h4>
                      <p className="text-sm text-gray-500">Modelo fixo com observações por item</p>
                    </div>
                    <Badge tone="info">
                      {entryChecklistProgress.checked}/{entryChecklistProgress.total}
                    </Badge>
                  </div>

                  {renderChecklist(entryChecklist, setEntryChecklist)}

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Camera className="w-4 h-4 text-red-600" />
                      Anexar fotos da saída
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={(event) => setEntryPhotos(event.target.files ? Array.from(event.target.files) : [])}
                      className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-red-600 file:px-4 file:py-2 file:text-white file:font-semibold hover:file:bg-red-700"
                    />
                    {entryPhotos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {entryPhotos.map((file) => (
                          <Badge key={`${file.name}-${file.size}`}>{file.name}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={resetEntryForm}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Limpar formulário
                </button>
                <button
                  type="submit"
                  disabled={movementSaving || entryChecklistProgress.checked !== entryChecklistProgress.total}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {movementSaving ? 'Salvando...' : 'Salvar checklist de saída'}
                </button>
              </div>
            </form>
          </section>

          <section className="glass rounded-2xl p-4 sm:p-6 shadow-premium">
            <div className="mb-5 flex items-center gap-2">
              <Truck className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-bold text-gray-900">Veículos no pátio</h3>
            </div>

            <div className="space-y-3 max-h-[760px] overflow-y-auto pr-1">
              {vehiclesInPatio.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                  Nenhum veículo disponível no pátio.
                </div>
              ) : (
                vehiclesInPatio.map((vehicle) => (
                  <div key={vehicle.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-gray-900">{vehicle.plate}</p>
                        <p className="text-sm text-gray-600">{vehicle.name}</p>
                        <p className="text-xs text-gray-500">Código: {formatShortCode(vehicle.short_code)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge tone="success">Disponível</Badge>
                        <button
                          type="button"
                          onClick={() => openVehicleEditModal(vehicle)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'entrada' && (
        <section className="glass rounded-2xl p-6 shadow-premium">
          <div className="mb-5 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-gray-900">Checklist de entrada</h3>
          </div>

          <div className="mb-5 flex flex-col gap-3 lg:flex-row">
            <Input
              label="Buscar movimentação aberta"
              value={entrySearch}
              onChange={(event) => setEntrySearch(event.target.value)}
              placeholder="Código de 3 dígitos, placa ou checklist"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setScannerOpen((prev) => !prev)}
                className="rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-100"
              >
                {scannerOpen ? 'Fechar câmera' : 'Abrir câmera'}
              </button>
            </div>
          </div>

          <BarcodeScanner
            open={scannerOpen}
            onClose={() => setScannerOpen(false)}
            onDetected={(value) => {
              lookupVehicleOrMovement(value);
              setScannerOpen(false);
            }}
          />

          <div className="space-y-3">
            {openMovements.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                Não há veículos em aberto no momento.
              </div>
            ) : (
              openMovements
                .filter((movement) => {
                  if (!entrySearch.trim()) return true;
                  const normalized = normalizeLookupValue(entrySearch);
                  return [movement.short_code, movement.vehicle_plate, movement.vehicle_id, movement.id].some((value) =>
                    normalizeLookupValue(value).includes(normalized)
                  );
                })
                .map((movement) => {
                  const completion = checklistCompletion(safeChecklistGroup((movement.checklist as Record<string, Json> | undefined)?.exit));
                  return (
                    <div key={movement.id} className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{movement.vehicle_plate}</p>
                          <p className="text-sm text-gray-600">{movement.driver_name}</p>
                          <p className="text-xs text-gray-500">
                            Saída {formatDateBR(movement.entry_date)} {movement.entry_time} | Código {formatShortCode(movement.short_code)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={movement.operation_type === 'Obras' ? 'warning' : 'info'}>{movement.operation_type}</Badge>
                          <Badge tone="info">
                            {completion.checked}/{completion.total}
                          </Badge>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={() => openExitModal(movement)}
                          className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
                        >
                          Registrar entrada
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </section>
      )}

      {activeTab === 'motoristas' && (
        <div className="space-y-6">
          <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              { label: 'Cadastrados', value: driverSummary.total, icon: Users, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
              { label: 'Ativos', value: driverSummary.active, icon: UserCheck, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
              { label: 'CNH regular', value: driverSummary.regular, icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
              { label: 'Precisam atenção', value: driverSummary.attention, icon: ShieldAlert, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className={`rounded-2xl border p-4 shadow-sm ${bg}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-600">{label}</p>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.4fr)]">
          <section className="glass rounded-2xl p-6 shadow-premium">
            <div className="mb-5 flex items-center gap-2">
              <Users className="w-5 h-5 text-red-600" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">{editingDriverId ? 'Editar motorista' : 'Novo motorista'}</h3>
                <p className="text-xs text-gray-500">Dados, validade e documento da CNH.</p>
              </div>
            </div>

            <form onSubmit={handleDriverSubmit} className="space-y-4">
              <Input
                label="Nome do motorista"
                value={driverForm.name}
                onChange={(event) => setDriverForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Nome completo"
                required
              />
              <Input
                label="Número da CNH"
                value={driverForm.cnh_number || ''}
                onChange={(event) => setDriverForm((prev) => ({ ...prev, cnh_number: event.target.value }))}
                placeholder="Opcional"
              />
              <Input
                label="Validade da CNH"
                type="date"
                value={driverForm.cnh_valid_until || ''}
                onChange={(event) => setDriverForm((prev) => ({ ...prev, cnh_valid_until: event.target.value }))}
                required={false}
              />
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Anexo da CNH</label>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-white px-4 py-4 text-sm text-gray-700 hover:border-red-400 hover:bg-red-50">
                  <FileUp className="h-5 w-5 flex-shrink-0 text-red-600" />
                  <span className="min-w-0 flex-1 truncate">
                    {driverCnhFile?.name ||
                      (editingDriverId
                        ? drivers.find((driver) => driver.id === editingDriverId)?.cnh_file_name
                        : '') ||
                      'Selecionar imagem ou PDF'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf,application/pdf"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      if (file && file.size > 10 * 1024 * 1024) {
                        onError('O anexo da CNH deve ter no máximo 10 MB');
                        event.target.value = '';
                        return;
                      }
                      setDriverCnhFile(file);
                    }}
                  />
                </label>
                <p className="text-xs text-gray-500">Formatos aceitos: imagem ou PDF, até 10 MB.</p>
              </div>
              <Input
                label="Telefone"
                value={driverForm.phone || ''}
                onChange={(event) => setDriverForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Opcional"
              />
              <Textarea
                label="Observações"
                value={driverForm.notes || ''}
                onChange={(event) => setDriverForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Opcional"
                rows={3}
              />
              <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Motorista ativo</p>
                  <p className="text-xs text-gray-500">Motoristas inativos não aparecem nas seleções de checklist.</p>
                </div>
                <input
                  type="checkbox"
                  checked={driverForm.is_active ?? true}
                  onChange={(event) => setDriverForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                  className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={driverSaving}
                  className="flex-1 rounded-xl bg-gray-900 px-4 py-3 font-semibold text-white hover:bg-black disabled:opacity-60"
                >
                  {driverSaving ? 'Salvando...' : editingDriverId ? 'Salvar alterações' : 'Adicionar motorista'}
                </button>
                {editingDriverId && (
                  <button
                    type="button"
                    onClick={cancelDriverEdit}
                    disabled={driverSaving}
                    className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                  >
                    Cancelar edição
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleImportHistoricalDrivers}
                  disabled={importingHistory}
                  className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                >
                  {importingHistory ? 'Importando...' : 'Importar do histórico'}
                </button>
              </div>
            </form>

            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              Os nomes importados do histórico entram como motoristas pendentes. Você pode excluir, incluir novos e completar a CNH depois.
            </div>

          </section>

          <section className="glass rounded-2xl p-6 shadow-premium">
            <div className="mb-5 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-600" />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Controle de motoristas</h3>
                    <p className="text-xs text-gray-500">{managedDrivers.length} de {drivers.length} registros exibidos</p>
                  </div>
                </div>
                {(driverManagementSearch || driverStatusFilter !== 'Todos') && (
                  <button
                    type="button"
                    onClick={() => {
                      setDriverManagementSearch('');
                      setDriverStatusFilter('Todos');
                    }}
                    className="text-sm font-semibold text-red-700 hover:text-red-900"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto]">
                <label className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    value={driverManagementSearch}
                    onChange={(event) => setDriverManagementSearch(event.target.value)}
                    placeholder="Buscar nome, código, CNH ou telefone"
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-4 focus:ring-red-100"
                  />
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={driverStatusFilter}
                    onChange={(event) => setDriverStatusFilter(event.target.value as DriverStatusFilter)}
                    className="min-w-32 bg-transparent py-3 text-sm font-semibold text-gray-700 outline-none"
                  >
                    {(['Todos', 'Ativos', 'Inativos', 'Regulares', 'Vencendo', 'Vencidas', 'Pendentes'] as DriverStatusFilter[]).map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <select
                  value={driverSort}
                  onChange={(event) => setDriverSort(event.target.value as DriverSort)}
                  className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-semibold text-gray-700 outline-none"
                >
                  <option value="name">Ordenar por nome</option>
                  <option value="validity">Ordenar por validade</option>
                  <option value="movements">Mais movimentações</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 max-h-[860px] overflow-y-auto pr-1">
              {managedDrivers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                  Nenhum motorista encontrado com esses filtros.
                </div>
              ) : (
                managedDrivers.map((driver) => {
                  const daysLeft = getDaysUntil(driver.cnh_valid_until);
                  const cnhStatus = getDriverCnhStatus(driver);
                  const movementStats = driverMovementStats.get(driver.id);
                  return (
                    <div key={driver.id} className={`rounded-2xl border bg-gray-50 p-4 ${!driver.is_active ? 'border-gray-300 opacity-75' : 'border-gray-200'}`}>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-gray-900">{driver.name}</p>
                            {!driver.is_active && <Badge tone="neutral">Inativo</Badge>}
                            <Badge tone={cnhStatus === 'Pendente' || cnhStatus === 'Vencendo' ? 'warning' : cnhStatus === 'Vencida' ? 'danger' : 'success'}>
                              {cnhStatus}
                            </Badge>
                          </div>
                          <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-gray-600 sm:grid-cols-2">
                            <p>{driver.cnh_number ? `CNH ${driver.cnh_number}` : 'Número da CNH não informado'}</p>
                            <p>{driver.cnh_valid_until ? `Validade: ${formatDateBR(driver.cnh_valid_until)}` : 'Sem validade informada'}</p>
                            <p>Código: {formatShortCode(driver.short_code)}</p>
                            <p>{movementStats?.count || 0} movimentação(ões)</p>
                            <p>{driver.phone?.trim() ? `Telefone: ${driver.phone}` : 'Telefone não informado'}</p>
                            <p>{movementStats?.lastDate ? `Última atividade: ${formatDateBR(movementStats.lastDate)}` : 'Sem atividade registrada'}</p>
                          </div>
                          {driver.cnh_file_url && (
                            <a
                              href={driver.cnh_file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-900"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Abrir anexo da CNH
                            </a>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-2 sm:flex-col sm:items-stretch">
                          <button
                            type="button"
                            onClick={() => handleDriverEdit(driver)}
                            className="inline-flex items-center gap-1 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            <Edit2 className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDriverDelete(driver.id)}
                            disabled={driverDeletingId === driver.id}
                            className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            <Trash2 className="w-4 h-4" />
                            {driverDeletingId === driver.id ? 'Excluindo...' : 'Excluir'}
                          </button>
                        </div>
                      </div>
                      {cnhStatus === 'Vencendo' && daysLeft !== null && (
                        <p className="mt-3 rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800">
                          A CNH vence em {daysLeft} dia(s).
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </section>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <section className="glass rounded-2xl p-6 shadow-premium">
          <div className="mb-5 flex items-center gap-2">
            <Timer className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-gray-900">Timeline</h3>
          </div>

          <div className="relative">
            {timelineEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
                Nenhuma movimentação operacional registrada.
              </div>
            ) : (
              <div className="relative pl-7">
                <div className="absolute left-3 top-3 bottom-3 w-px bg-gray-200" />
                <div className="space-y-4">
                  {timelineEvents.map((event) => (
                    <div key={event.id} className="relative">
                      <div
                        className={`absolute -left-[1.9rem] top-5 h-4 w-4 rounded-full border-4 border-white shadow ${
                          event.kind === 'saida' ? 'bg-red-500' : 'bg-green-500'
                        }`}
                      />
                      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-bold text-gray-900">
                              {event.driverName} {event.kind === 'saida' ? 'retirou' : 'devolveu'} {event.movement.vehicle_plate}
                            </p>
                            <p className="text-sm text-gray-600">
                              {event.kind === 'saida' ? 'Saiu do pátio' : 'Voltou para o pátio'} em {formatDateBR(event.date)} às {event.time}
                            </p>
                            <p className="text-xs text-gray-500">
                              Código {formatShortCode(event.movement.short_code)} | {event.movement.operation_type}
                            </p>
                          </div>
                          <Badge tone={event.kind === 'saida' ? 'danger' : 'success'}>
                            {event.kind === 'saida' ? 'Saída' : 'Entrada'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {activeTab === 'relatorios' && (
        <section className="glass rounded-2xl p-6 shadow-premium">
          <div className="mb-5 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-gray-900">Relatórios</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <Input
              label="Data inicial"
              type="date"
              value={reportStartDate}
              onChange={(event) => setReportStartDate(event.target.value)}
            />
            <Input
              label="Data final"
              type="date"
              value={reportEndDate}
              onChange={(event) => setReportEndDate(event.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm font-semibold text-red-700">Em aberto</p>
              <p className="mt-2 text-3xl font-bold text-red-600">{openMovements.length}</p>
            </div>
            <div className="rounded-2xl bg-green-50 border border-green-200 p-4">
              <p className="text-sm font-semibold text-green-700">No pátio</p>
              <p className="mt-2 text-3xl font-bold text-green-600">{vehiclesInPatio.length}</p>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-semibold text-amber-700">Em obra</p>
              <p className="mt-2 text-3xl font-bold text-amber-600">{vehiclesInWork.length}</p>
            </div>
            <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
              <p className="text-sm font-semibold text-blue-700">Motoristas</p>
              <p className="mt-2 text-3xl font-bold text-blue-600">{drivers.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Movimentações no período</h4>
                <Badge tone="info">{filteredMovements.length}</Badge>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {filteredMovements.length === 0 ? (
                  <p className="text-sm text-gray-500">Nenhuma movimentação no período.</p>
                ) : (
                  filteredMovements.map((movement) => (
                    <div key={movement.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-900">{movement.vehicle_plate}</p>
                          <p className="text-sm text-gray-600">{movement.driver_name}</p>
                          <p className="text-xs text-gray-500">Código: {formatShortCode(movement.short_code)}</p>
                          <p className="text-xs text-gray-500">
                            Saída {formatDateBR(movement.entry_date)} {movement.entry_time}
                            {movement.exit_date ? ` | Entrada ${formatDateBR(movement.exit_date)} ${movement.exit_time}` : ''}
                          </p>
                        </div>
                        <Badge tone={movement.status === 'Em aberto' ? 'danger' : 'success'}>{movement.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">CNH pendente ou vencendo</h4>
                <Badge tone="warning">{expiringDrivers.length}</Badge>
              </div>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {expiringDrivers.length === 0 ? (
                  <p className="text-sm text-gray-500">Sem alertas de CNH.</p>
                ) : (
                  expiringDrivers.map((driver) => {
                    const daysLeft = getDaysUntil(driver.cnh_valid_until);
                    return (
                      <div key={driver.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-gray-900">{driver.name}</p>
                            <p className="text-sm text-gray-600">
                              {driver.cnh_number ? `CNH ${driver.cnh_number}` : 'Número da CNH não informado'}
                            </p>
                            <p className="text-xs text-gray-500">Código: {formatShortCode(driver.short_code)}</p>
                            <p className="text-xs text-gray-500">
                              {driver.cnh_valid_until ? `Validade: ${formatDateBR(driver.cnh_valid_until)}` : 'Sem validade informada'}
                            </p>
                          </div>
                          <Badge tone={isDriverCnhPending(driver) ? 'warning' : daysLeft !== null && daysLeft < 0 ? 'danger' : 'warning'}>
                            {isDriverCnhPending(driver) ? 'Pendente' : daysLeft !== null && daysLeft < 0 ? 'Vencida' : `${daysLeft}d`}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Status do relatório
            </div>
            <p className="mt-2 text-sm text-gray-600">
              O painel agrupa entradas, saídas, veículos em pátio e motoristas com CNH pendente ou vencendo.
            </p>
          </div>
        </section>
      )}

      <Modal
        isOpen={!!movementToClose}
        onClose={() => setMovementToClose(null)}
        title="Checklist de entrada"
        size="xl"
      >
        {movementToClose && (
          <form onSubmit={handleExitSubmit} className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="font-bold text-gray-900">{movementToClose.vehicle_plate}</p>
              <p className="text-sm text-gray-600">Motorista da saída: {movementToClose.driver_name}</p>
              <p className="text-xs text-gray-500">Código da movimentação: {formatShortCode(movementToClose.short_code)}</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Motorista na entrada</label>
              <select
                value={returnDriverId}
                onChange={(event) => setReturnDriverId(event.target.value)}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 focus:border-red-500 focus:ring-4 focus:ring-red-100"
              >
                <option value="">Não informado</option>
                {drivers
                  .filter((driver) => driver.is_active || driver.id === movementToClose.driver_id)
                  .map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {formatShortCode(driver.short_code)} - {driver.name}
                      {driver.cnh_number ? ` - CNH ${driver.cnh_number}` : ' - número não informado'}
                    </option>
                  ))}
              </select>
              {returnDriverId !== (movementToClose.driver_id || '') && (
                <p className="text-xs text-amber-700">
                  Ao finalizar, o sistema vai pedir confirmação para trocar o motorista da movimentação.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Data de entrada"
                type="date"
                value={exitForm.exit_date}
                onChange={(event) => setExitForm((prev) => ({ ...prev, exit_date: event.target.value }))}
              />
              <Input
                label="Hora de entrada"
                type="time"
                value={exitForm.exit_time}
                onChange={(event) => setExitForm((prev) => ({ ...prev, exit_time: event.target.value }))}
              />
            </div>

            <Input
              label="Odômetro de entrada"
              type="number"
              min="0"
              value={exitForm.exit_odometer}
              onChange={(event) => setExitForm((prev) => ({ ...prev, exit_odometer: event.target.value }))}
              placeholder="Ex: 125980"
            />

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Combustível na entrada *</label>
              <select
                value={exitForm.exit_fuel_level}
                onChange={(event) => setExitForm((prev) => ({ ...prev, exit_fuel_level: event.target.value as FuelLevel }))}
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 focus:border-red-500 focus:ring-4 focus:ring-red-100"
              >
                {FUEL_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <Textarea
              label="Observações de entrada"
              value={exitForm.exit_observations}
              onChange={(event) => setExitForm((prev) => ({ ...prev, exit_observations: event.target.value }))}
              placeholder="Irregularidades, avarias ou observações da entrada"
              rows={4}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Checklist de entrada</h4>
                <Badge tone="info">
                  {exitChecklistProgress.checked}/{exitChecklistProgress.total}
                </Badge>
              </div>
              {renderChecklist(exitChecklist, setExitChecklist)}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <Camera className="w-4 h-4 text-red-600" />
                Anexar fotos da entrada
              </div>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={(event) => setExitPhotos(event.target.files ? Array.from(event.target.files) : [])}
                className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-xl file:border-0 file:bg-red-600 file:px-4 file:py-2 file:text-white file:font-semibold hover:file:bg-red-700"
              />
              {exitPhotos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {exitPhotos.map((file) => (
                    <Badge key={`${file.name}-${file.size}`}>{file.name}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setMovementToClose(null)}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={movementSaving || exitChecklistProgress.checked !== exitChecklistProgress.total}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {movementSaving ? 'Finalizando...' : 'Finalizar entrada'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!vehicleToEdit}
        onClose={closeVehicleEditModal}
        title="Editar veículo no pátio"
        size="lg"
      >
        {vehicleToEdit && (
          <form onSubmit={handleVehicleEditSubmit} className="space-y-6">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="font-bold text-gray-900">Código {formatShortCode(vehicleToEdit.short_code)}</p>
              <p className="text-sm text-gray-600">
                Ajuste os dados do veículo sem sair da aba de pátio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Placa"
                value={vehicleEditForm.plate}
                onChange={(event) =>
                  setVehicleEditForm((prev) => ({ ...prev, plate: event.target.value.toUpperCase() }))
                }
                error={vehicleEditErrors.plate}
                required
                placeholder="ABC-1234"
              />
              <Input
                label="Nome"
                value={vehicleEditForm.name}
                onChange={(event) => setVehicleEditForm((prev) => ({ ...prev, name: event.target.value }))}
                error={vehicleEditErrors.name}
                required
                placeholder="Ex: Fiat Strada 2024"
              />
            </div>

            <Input
              label="Responsável/Motorista"
              value={vehicleEditForm.responsible_name}
              onChange={(event) =>
                setVehicleEditForm((prev) => ({ ...prev, responsible_name: event.target.value }))
              }
              placeholder="Ex: João Silva"
            />

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Condutor fixo</label>
              <select
                value={vehicleEditForm.fixed_driver_name}
                onChange={(event) =>
                  setVehicleEditForm((prev) => ({ ...prev, fixed_driver_name: event.target.value }))
                }
                className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 focus:border-red-500 focus:ring-4 focus:ring-red-100"
              >
                <option value="">Sem condutor fixo</option>
                {vehicleEditForm.fixed_driver_name &&
                  !activeDrivers.some((driver) => driver.name === vehicleEditForm.fixed_driver_name) && (
                    <option value={vehicleEditForm.fixed_driver_name}>{vehicleEditForm.fixed_driver_name}</option>
                  )}
                {activeDrivers.map((driver) => (
                  <option key={driver.id} value={driver.name}>
                    {formatShortCode(driver.short_code)} - {driver.name}
                  </option>
                ))}
              </select>
            </div>
            <p className="-mt-4 text-xs text-gray-500">
              Com condutor fixo, o veículo fica reservado e não aparece para retirada comum.
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Status</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {VEHICLE_STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setVehicleEditForm((prev) => ({ ...prev, status }))}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold border transition-all ${
                      vehicleEditForm.status === status
                        ? 'gradient-primary text-white border-transparent shadow-premium-colored'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-red-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              {vehicleEditErrors.status && <p className="text-sm text-red-600">{vehicleEditErrors.status}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Disponibilidade no pátio</label>
              <button
                type="button"
                onClick={() => setVehicleEditForm((prev) => ({ ...prev, in_patio: !prev.in_patio }))}
                className={`w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${
                  vehicleEditForm.in_patio
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
              >
                {vehicleEditForm.in_patio ? 'Disponível no pátio' : 'Fora do pátio'}
              </button>
              <p className="text-xs text-gray-500">
                Se desligar essa opção, o veículo sai da lista de disponíveis.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={closeVehicleEditModal}
                className="flex-1 rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={vehicleEditSaving}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {vehicleEditSaving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
