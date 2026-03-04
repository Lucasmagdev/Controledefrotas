import { useRef, useState, useEffect } from 'react';
import { Trash2, Check, PenTool, AlertCircle } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (signature: string) => void;
  label: string;
  required?: boolean;
  error?: string;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 250;

export function SignaturePad({ value, onChange, label, required, error }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [isHovering, setIsHovering] = useState(false);

  // Inicializar canvas quando montar
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Definir fundo branco
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Definir cor e espessura da caneta
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    console.log('✅ Canvas inicializado:', { width: canvas.width, height: canvas.height });
  }, []);

  // Carregar assinatura salva
  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Desenhar fundo branco primeiro
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Depois desenhar a imagem
          ctx.drawImage(img, 0, 0);
          setIsEmpty(false);
          setHasDrawn(true);
          console.log('📸 Assinatura carregada do banco (JPEG)');
        };
        img.onerror = () => {
          console.error('❌ Erro ao carregar assinatura');
        };
        img.src = value;
      }
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('❌ Canvas não encontrado');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Contexto 2D não disponível');
      return;
    }

    console.log('✏️ Começou a desenhar em:', { x, y });
    setIsDrawing(true);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    if (!hasDrawn) {
      setHasDrawn(true);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    console.log('⏹️ Parou de desenhar');
    setIsDrawing(false);
    setIsEmpty(false);

    saveSignature();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error('❌ Canvas não encontrado ao salvar');
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Contexto 2D não disponível ao salvar');
      return;
    }

    // Verificar se há pixels desenhados
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let hasPixels = false;

    // Verificar de 4 em 4 (RGBA)
    for (let i = 0; i < data.length; i += 4) {
      // Se o pixel não é branco (255, 255, 255)
      if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
        hasPixels = true;
        break;
      }
    }

    console.log('🔍 Análise canvas:', { 
      hasPixels,
      totalPixels: canvas.width * canvas.height,
      width: canvas.width,
      height: canvas.height
    });

    // Usar JPEG com qualidade 0.4 para reduzir tamanho drasticamente
    const signature = canvas.toDataURL('image/jpeg', 0.4);
    const size = signature.length;

    console.log('📝 Assinatura capturada:', {
      tamanho: size + ' caracteres',
      formato: 'JPEG 40% qualidade',
      primeiros50chars: signature.substring(0, 50),
      temConteudo: size > 1000,
      hasPixels
    });

    if (!hasPixels && hasDrawn) {
      console.warn('⚠️ Canvas vazio mas hasDrawn=true. Pode ser problema de escala.');
    }

    onChange(signature);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    setIsEmpty(true);
    setHasDrawn(false);
    console.log('🗑️ Assinatura limpa');
    onChange('');
  };

  return (
    <div className="space-y-3 input-enhanced">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <PenTool className="w-4 h-4 text-purple-500" />
        {label} {required && <span className="text-red-500 text-base">*</span>}
      </label>

      <div 
        className={`relative group rounded-2xl overflow-hidden border-2 transition-all duration-300 shadow-premium hover:shadow-premium-lg ${
          error 
            ? 'border-red-400 bg-red-50/30' 
            : isHovering 
            ? 'border-purple-400 bg-purple-50/30' 
            : 'border-gray-200 bg-white'
        }`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Canvas com gradiente de fundo */}
        <div className="relative">
          {isEmpty && !isDrawing && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="text-center space-y-2 animate-bounce-in">
                <PenTool className="w-12 h-12 text-gray-300 mx-auto" />
                <p className="text-sm font-semibold text-gray-400">
                  Assine aqui
                </p>
              </div>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className={`w-full block cursor-crosshair transition-all duration-300 ${
              isDrawing ? 'cursor-none' : 'cursor-crosshair'
            }`}
            style={{
              touchAction: 'none',
              display: 'block',
              boxSizing: 'border-box',
              height: 'clamp(200px, 40vw, 250px)',
              backgroundColor: '#ffffff',
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {/* Cursor customizado durante desenho */}
          {isDrawing && (
            <div className="absolute top-2 left-2 animate-pulse">
              <div className="w-3 h-3 bg-purple-500 rounded-full shadow-lg"></div>
            </div>
          )}
        </div>

        {/* Footer com botões estilizados */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 glass border-t border-gray-200/50">
          <button
            type="button"
            onClick={clear}
            className="group relative w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar</span>
          </button>

          {!isEmpty && (
            <div className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-2.5 bg-green-500 text-white rounded-xl font-semibold shadow-sm animate-bounce-in">
              <Check className="w-5 h-5" />
              <span>Assinatura capturada</span>
            </div>
          )}

          {isEmpty && (
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm text-gray-500 font-medium">
              <span>Clique ou toque para assinar</span>
            </div>
          )}
        </div>

        {/* Borda animada no hover */}
        {isHovering && !error && (
          <div className="absolute inset-0 rounded-2xl pointer-events-none">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-20 animate-pulse"></div>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-red-600 animate-slide-in">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
    </div>
  );
}
