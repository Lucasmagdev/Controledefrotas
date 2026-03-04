import { useRef, useState, useEffect } from 'react';
import { Trash2, Check } from 'lucide-react';

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
    ctx.lineWidth = 4;
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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="border-2 border-gray-300 rounded-lg bg-white overflow-hidden shadow-sm">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full block bg-white border-b border-gray-200 cursor-crosshair"
          style={{
            touchAction: 'none',
            display: 'block',
            boxSizing: 'border-box',
            height: 'clamp(180px, 38vw, 250px)',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50">
          <button
            type="button"
            onClick={clear}
            className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </button>

          {!isEmpty && (
            <div className="w-full sm:w-auto justify-center flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-sm">
              <Check className="w-5 h-5" />
              ✓ Assinatura capturada
            </div>
          )}

          {isEmpty && (
            <div className="w-full sm:w-auto text-center sm:text-left text-sm text-gray-500">
              👆 Clique ou toque para desenhar a assinatura
            </div>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
}
