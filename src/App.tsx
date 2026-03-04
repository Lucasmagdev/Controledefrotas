import { useState } from 'react';
import { FileText, Database } from 'lucide-react';
import { VehicleForm } from './components/VehicleForm';
import { DatabaseView } from './components/DatabaseView';
import { Toast } from './components/Toast';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';

type Tab = 'form' | 'database';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  show: boolean;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('form');
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', show: false });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-700 p-1.5 rounded-lg">
                <img src="/gontijofundacoes_logo.jpg" alt="Logo" className="w-8 h-8 rounded" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Controle de Veículos
                </h1>
                <p className="text-sm text-gray-500">
                  Gestão de retiradas e devoluções
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex gap-1 border-b">
            <button
              onClick={() => setActiveTab('form')}
              className={`min-w-0 flex items-center justify-center gap-2 px-3 sm:px-6 py-3 text-sm sm:text-base font-medium transition-all whitespace-nowrap ${
                activeTab === 'form'
                  ? 'text-red-700 border-b-2 border-red-700 bg-red-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="sm:hidden">Formulário</span>
              <span className="hidden sm:inline">Formulário de Registro</span>
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`min-w-0 flex items-center justify-center gap-2 px-3 sm:px-6 py-3 text-sm sm:text-base font-medium transition-all whitespace-nowrap ${
                activeTab === 'database'
                  ? 'text-red-700 border-b-2 border-red-700 bg-red-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Database className="w-5 h-5" />
              <span className="sm:hidden">Banco</span>
              <span className="hidden sm:inline">Banco de Dados & Relatório</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeTab === 'form' && (
          <div className="animate-fade-in">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Novo Registro de Veículo
              </h2>
              <p className="text-gray-600 mt-1">
                Preencha os dados de retirada e, opcionalmente, de devolução
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
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Banco de Dados & Relatórios
              </h2>
              <p className="text-gray-600 mt-1">
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
      </div>

      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((prev) => ({ ...prev, show: false }))}
        />
      )}

      <PWAInstallPrompt />
    </div>
  );
}

export default App;
