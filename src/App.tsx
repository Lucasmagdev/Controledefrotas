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
    <div className="min-h-screen gradient-mesh">
      {/* Header Premium com Gradiente */}
      <div className="glass sticky top-0 z-40 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 sm:py-5">
            <div className="flex items-center gap-3 sm:gap-4 animate-slide-in">
              <div className="relative group">
                <div className="absolute inset-0 gradient-primary rounded-xl blur-sm group-hover:blur-md transition-all opacity-75"></div>
                <div className="relative gradient-primary p-2 rounded-xl shadow-premium">
                  <img 
                    src="/gontijofundacoes_logo.jpg" 
                    alt="Logo" 
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg object-cover ring-2 ring-white/50" 
                  />
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  Controle de Veículos
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Gestão inteligente de frotas
                </p>
              </div>
            </div>
          </div>

          {/* Tabs Modernos */}
          <div className="grid grid-cols-2 sm:flex gap-2 pb-4">
            <button
              onClick={() => setActiveTab('form')}
              className={`group relative flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold rounded-xl transition-all duration-300 whitespace-nowrap ${
                activeTab === 'form'
                  ? 'gradient-primary text-white shadow-premium-colored scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-premium'
              }`}
            >
              <FileText className={`w-5 h-5 ${activeTab === 'form' ? '' : ''}`} />
              <span className="sm:hidden">Formulário</span>
              <span className="hidden sm:inline">Novo Registro</span>
              {activeTab === 'form' && (
                <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`group relative flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base font-semibold rounded-xl transition-all duration-300 whitespace-nowrap ${
                activeTab === 'database'
                  ? 'gradient-primary text-white shadow-premium-colored scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/80 hover:shadow-premium'
              }`}
            >
              <Database className={`w-5 h-5 ${activeTab === 'database' ? '' : ''}`} />
              <span className="sm:hidden">Dados</span>
              <span className="hidden sm:inline">Banco & Relatórios</span>
              {activeTab === 'database' && (
                <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {activeTab === 'form' && (
          <div className="animate-fade-in">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Novo Registro
              </h2>
              <p className="text-gray-600">
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
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                Banco de Dados & Relatórios
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
