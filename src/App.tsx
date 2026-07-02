import { useEffect, useState } from 'react';
import { BarChart3, Car, ClipboardCheck, Database, FileText, LogOut } from 'lucide-react';
import { VehicleForm } from './components/VehicleForm';
import { DatabaseView } from './components/DatabaseView';
import { Dashboard } from './components/Dashboard';
import { VehiclesView } from './components/VehiclesView';
import { OperationalView } from './components/OperationalView';
import { Toast } from './components/Toast';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { Login } from './components/Login';
import { vehicleService } from './services/vehicleService';
import type { VehicleRecord } from './types/database';

type Tab = 'form' | 'database' | 'dashboard' | 'operational' | 'vehicles';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  show: boolean;
}

function getStartupRoute() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab')?.toLowerCase();
  const vehicleLookup = params.get('veiculo') || params.get('vehicle') || params.get('codigo') || params.get('code') || '';
  const accessLookup = params.get('pessoa') || params.get('person') || params.get('veiculo_pessoal') || params.get('personal_vehicle') || '';

  return {
    tab:
      tab === 'portaria' || tab === 'access' || accessLookup
        ? 'operational'
        : tab === 'patio' || tab === 'operational' || vehicleLookup
        ? 'operational'
        : 'form',
    vehicleLookup,
    accessLookup,
  } satisfies { tab: Tab; vehicleLookup: string; accessLookup: string };
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const startupRoute = getStartupRoute();
  const [activeTab, setActiveTab] = useState<Tab>(startupRoute.tab);
  const [operationalLookup] = useState(startupRoute.vehicleLookup);
  const [accessLookup] = useState(startupRoute.accessLookup);
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', show: false });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [records, setRecords] = useState<VehicleRecord[]>([]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadRecords();
    }
  }, [activeTab, refreshTrigger]);

  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const loadRecords = async () => {
    try {
      const data = await vehicleService.listRecords();
      setRecords(data);
    } catch (error) {
      console.error('Erro ao carregar registros:', error);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    if (confirm('Deseja realmente sair do sistema?')) {
      localStorage.removeItem('isAuthenticated');
      setIsAuthenticated(false);
      setActiveTab('form');
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type, show: true });
  };

  const handleFormSuccess = () => {
    showToast('Registro salvo com sucesso', 'success');
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => {
      setActiveTab('database');
    }, 1500);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen gradient-mesh pb-20">
      <div className="decoration-sphere decoration-sphere-1" />
      <div className="decoration-sphere decoration-sphere-2" />
      <div className="decoration-sphere decoration-sphere-3" />
      <div className="decoration-sphere decoration-sphere-4" />
      <div className="decoration-sphere decoration-sphere-5" />
      <div className="decoration-sphere decoration-sphere-6" />

      <div className="decoration-accent decoration-accent-1" />
      <div className="decoration-accent decoration-accent-2" />
      <div className="decoration-accent decoration-accent-3" />

      <div className="glass sticky top-0 z-40 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3 animate-slide-in">
              <div className="relative">
                <img
                  src="/gontijofundacoes_logo.jpg"
                  alt="Logo Gontijo"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                  Controle de Veiculos
                </h1>
                <p className="text-xs text-gray-500">
                  Gestao inteligente de frotas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 mb-20">
        {activeTab === 'form' && (
          <div className="animate-fade-in">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Novo Registro
              </h2>
              <p className="text-gray-600">
                Registre a retirada com assinatura. A devolucao e feita depois no mesmo registro.
              </p>
            </div>
            <VehicleForm
              onSuccess={handleFormSuccess}
              onError={(message) => showToast(message, 'error')}
            />
          </div>
        )}

        {activeTab === 'database' && (
          <div className="animate-fade-in">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Banco de Dados
              </h2>
              <p className="text-gray-600">
                Visualize, busque, exporte e gerencie todos os registros
              </p>
            </div>
            <DatabaseView
              onSuccess={(message) => showToast(message, 'success')}
              onError={(message) => showToast(message, 'error')}
              refreshTrigger={refreshTrigger}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="animate-fade-in">
            <Dashboard records={records} />
          </div>
        )}

        {activeTab === 'operational' && (
          <div className="animate-fade-in">
            <OperationalView
              initialVehicleLookup={operationalLookup}
              initialAccessLookup={accessLookup}
              onSuccess={(message) => showToast(message, 'success')}
              onError={(message) => showToast(message, 'error')}
            />
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="animate-fade-in">
            <VehiclesView
              onSuccess={(message) => showToast(message, 'success')}
              onError={(message) => showToast(message, 'error')}
            />
          </div>
        )}
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/20 safe-area-inset-bottom">
        <div className="max-w-2xl mx-auto px-2 sm:px-4">
          <div className="grid grid-cols-6 gap-1 py-3">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex flex-col items-center gap-1 py-2 px-1 sm:px-3 rounded-lg transition-all duration-200 ${
                activeTab === 'form' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className={`w-6 h-6 ${activeTab === 'form' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] sm:text-xs font-medium">Registro</span>
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex flex-col items-center gap-1 py-2 px-1 sm:px-3 rounded-lg transition-all duration-200 ${
                activeTab === 'database' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database className={`w-6 h-6 ${activeTab === 'database' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] sm:text-xs font-medium">Banco</span>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center gap-1 py-2 px-1 sm:px-3 rounded-lg transition-all duration-200 ${
                activeTab === 'dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className={`w-6 h-6 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] sm:text-xs font-medium">Relatorios</span>
            </button>
            <button
              onClick={() => setActiveTab('operational')}
              className={`flex flex-col items-center gap-1 py-2 px-1 sm:px-3 rounded-lg transition-all duration-200 ${
                activeTab === 'operational' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <ClipboardCheck className={`w-6 h-6 ${activeTab === 'operational' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] sm:text-xs font-medium">Patio</span>
            </button>
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex flex-col items-center gap-1 py-2 px-1 sm:px-3 rounded-lg transition-all duration-200 ${
                activeTab === 'vehicles' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Car className={`w-6 h-6 ${activeTab === 'vehicles' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[11px] sm:text-xs font-medium">Veiculos</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 py-2 px-1 sm:px-3 rounded-lg transition-all duration-200 text-gray-500 hover:text-red-600"
            >
              <LogOut className="w-6 h-6 stroke-2" />
              <span className="text-[11px] sm:text-xs font-medium">Sair</span>
            </button>
          </div>
        </div>
      </nav>

      <PWAInstallPrompt />
    </div>
  );
}

export default App;
