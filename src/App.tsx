import { useState, useEffect } from 'react';
import { FileText, Database, LogOut } from 'lucide-react';
import { VehicleForm } from './components/VehicleForm';
import { DatabaseView } from './components/DatabaseView';
import { Toast } from './components/Toast';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { Login } from './components/Login';

type Tab = 'form' | 'database';

interface ToastState {
  message: string;
  type: 'success' | 'error';
  show: boolean;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('form');
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success', show: false });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Verificar autenticação ao carregar
  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

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

  // Mostrar tela de login se não estiver autenticado
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen gradient-mesh pb-20">
      {/* Header Simplificado */}
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
                  Controle de Veículos
                </h1>
                <p className="text-xs text-gray-500">
                  Gestão inteligente de frotas
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 mb-20">
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/20 safe-area-inset-bottom">
        <div className="max-w-md mx-auto px-4">
          <div className="grid grid-cols-3 gap-2 py-3">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200 ${
                activeTab === 'form'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className={`w-6 h-6 ${activeTab === 'form' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-xs font-medium">Registro</span>
            </button>
            <button
              onClick={() => setActiveTab('database')}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200 ${
                activeTab === 'database'
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Database className={`w-6 h-6 ${activeTab === 'database' ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-xs font-medium">Banco</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all duration-200 text-gray-500 hover:text-red-600"
            >
              <LogOut className="w-6 h-6 stroke-2" />
              <span className="text-xs font-medium">Sair</span>
            </button>
          </div>
        </div>
      </nav>

      <PWAInstallPrompt />
    </div>
  );
}

export default App;
