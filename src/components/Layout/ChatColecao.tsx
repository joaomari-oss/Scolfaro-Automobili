/**
 * D3 – ChatColecao
 * Chat flutuante com IA sobre a coleção de veículos.
 */
import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, RefreshCw } from 'lucide-react';
import type { Veiculo } from '../../types/veiculo';
import { formatCurrency } from '../../utils/formatters';

interface Mensagem {
  role: 'user' | 'ia';
  texto: string;
  timestamp: Date;
}

interface Props {
  veiculos: Veiculo[];
}

async function consultarIA(pergunta: string, veiculos: Veiculo[], historico: Mensagem[]): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) return 'Configure VITE_GEMINI_API_KEY para usar o chat com IA.';

  const totalMercado = veiculos.reduce((s, v) => s + v.valorMercado, 0);
  const contexto = `Você é o assistente da coleção Scolfaro Automobili. 
Acervo: ${veiculos.length} veículos, valor total R$ ${formatCurrency(totalMercado)}.
Veículos: ${veiculos.map(v => `${v.marca} ${v.modelo} ${v.ano} (${formatCurrency(v.valorMercado)})`).join(', ')}.
Responda em português, de forma concisa e direta.`;

  const contents = [
    { role: 'user' as const, parts: [{ text: contexto }] },
    ...historico.slice(-6).map(m => ({
      role: m.role === 'user' ? 'user' as const : 'model' as const,
      parts: [{ text: m.texto }],
    })),
    { role: 'user' as const, parts: [{ text: pergunta }] },
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
        }),
      }
    );
    if (!response.ok) return 'Erro ao consultar IA. Tente novamente.';
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Sem resposta.';
  } catch {
    return 'Erro de conexão. Verifique sua internet.';
  }
}

export default function ChatColecao({ veiculos }: Props) {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  const enviar = async () => {
    const texto = input.trim();
    if (!texto || loading) return;
    setInput('');

    const msgUser: Mensagem = { role: 'user', texto, timestamp: new Date() };
    setMensagens(prev => [...prev, msgUser]);
    setLoading(true);

    const resposta = await consultarIA(texto, veiculos, [...mensagens, msgUser]);
    setMensagens(prev => [...prev, { role: 'ia', texto: resposta, timestamp: new Date() }]);
    setLoading(false);
  };

  const SUGESTOES = [
    'Qual é o veículo mais valioso?',
    'Qual tem maior km?',
    'Analise a coleção',
    'Quais estão favoritos?',
  ];

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setAberto(v => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all"
        style={{
          backgroundColor: 'var(--accent-primary)',
          color: 'var(--text-on-accent, #0A0A0A)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
          transform: aberto ? 'rotate(0deg)' : 'scale(1)',
        }}
        aria-label="Chat com IA"
      >
        {aberto ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Painel do chat */}
      {aberto && (
        <div
          className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 rounded-2xl border overflow-hidden animate-fade-in-up"
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-lg)',
            height: 480,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 border-b flex items-center justify-between"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
                style={{ backgroundColor: 'var(--accent-primary)', color: '#0A0A0A' }}>
                🤖
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Assistente IA</p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Gemini · {veiculos.length} veículos</p>
              </div>
            </div>
            {mensagens.length > 0 && (
              <button
                onClick={() => setMensagens([])}
                className="p-1 rounded"
                style={{ color: 'var(--text-muted)' }}
                title="Limpar conversa"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {mensagens.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                  Olá! Pergunte sobre sua coleção.
                </p>
                <div className="flex flex-col gap-2">
                  {SUGESTOES.map(s => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); }}
                      className="text-left text-xs px-3 py-2 rounded-xl border"
                      style={{
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        backgroundColor: 'var(--bg-tertiary)',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {mensagens.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ia'}>
                <p className="text-sm" style={{ color: 'var(--text-primary)', lineHeight: 1.5 }}>
                  {m.texto}
                </p>
              </div>
            ))}
            {loading && (
              <div className="chat-bubble-ia">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent-primary)', animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent-primary)', animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--accent-primary)', animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={fimRef} />
          </div>

          {/* Input */}
          <div
            className="p-3 border-t flex gap-2"
            style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && enviar()}
              placeholder="Pergunte sobre a coleção..."
              className="sa-input flex-1 text-sm py-2"
              style={{ borderRadius: 'var(--radius-full)' }}
              disabled={loading}
            />
            <button
              onClick={enviar}
              disabled={!input.trim() || loading}
              className="p-2 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: input.trim() ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: input.trim() ? '#0A0A0A' : 'var(--text-muted)',
                transition: 'background-color 150ms ease',
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
