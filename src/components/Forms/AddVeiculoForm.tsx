import { useState, useRef } from 'react';
import { Upload, X, Bot, Save, Camera } from 'lucide-react';
import type { Veiculo, TipoVeiculo, FichaTecnica } from '../../types/veiculo';
import { generateId } from '../../utils/formatters';
import { useIA } from '../../hooks/useIA';
import { showToast } from '../Layout/Toast';

interface Props {
  theme: 'dark' | 'light';
  marcasExistentes: string[];
  onSave: (v: Veiculo) => void;
}

const tiposOpcoes: { value: TipoVeiculo; label: string }[] = [
  { value: 'sedan',      label: 'Sedan' },
  { value: 'suv',        label: 'SUV / 4x4' },
  { value: 'esportivo',  label: 'Esportivo' },
  { value: 'hatch',      label: 'Hatch' },
  { value: 'picape',     label: 'Picape' },
  { value: 'conversivel',label: 'Conversível' },
  { value: 'moto',       label: 'Moto' },
  { value: 'van',        label: 'Van / Utilitário' },
  { value: 'utilitario', label: 'Utilitário' },
  { value: 'classico',   label: 'Clássico' },
];

const combustivelOpcoes = ['Gasolina', 'Etanol', 'Flex', 'Diesel', 'Elétrico', 'Híbrido'];
const cambioOpcoes      = ['Manual', 'Automático', 'CVT', 'Automatizado', 'Dupla Embreagem'];
const tracaoOpcoes      = ['Dianteira', 'Traseira', 'Integral/AWD', '4x4'];

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h3 className="form-section-title">{children}</h3>
);

const Field = ({ label, children, span2 = false }: { label: string; children: React.ReactNode; span2?: boolean }) => (
  <div className={span2 ? 'sm:col-span-2' : ''}>
    <label className="sa-label block mb-1.5">{label}</label>
    {children}
  </div>
);

export default function AddVeiculoForm({ marcasExistentes, onSave }: Props) {
  const { buscarValores, loading: iaLoading } = useIA();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [modelo,       setModelo]       = useState('');
  const [marca,        setMarca]        = useState('');
  const [ano,          setAno]          = useState<number | ''>('');
  const [placa,        setPlaca]        = useState('');
  const [cor,          setCor]          = useState('');
  const [tipo,         setTipo]         = useState<TipoVeiculo>('sedan');
  const [combustivel,  setCombustivel]  = useState('Gasolina');
  const [cambio,       setCambio]       = useState('Automático');
  const [quilometragem,setQuilometragem]= useState<number | ''>(0);
  const [notas,        setNotas]        = useState('');
  const [valorMercado, setValorMercado] = useState<number | ''>('');
  const [valorFipe,    setValorFipe]    = useState<number | ''>('');
  const [motor,        setMotor]        = useState('');
  const [potencia,     setPotencia]     = useState('');
  const [torque,       setTorque]       = useState('');
  const [tracao,       setTracao]       = useState('');
  const [aceleracao,   setAceleracao]   = useState('');
  const [velocidadeMaxima, setVelocidadeMaxima] = useState('');
  const [pesoKg,       setPesoKg]       = useState<number | ''>('');
  const [capacidadeTanque, setCapacidadeTanque] = useState<number | ''>('');
  const [consumoUrbano, setConsumoUrbano] = useState('');
  const [consumoRodovia, setConsumoRodovia] = useState('');
  const [dimensoes,    setDimensoes]    = useState('');
  const [capacidadePassageiros, setCapacidadePassageiros] = useState<number | ''>('');
  const [outros,       setOutros]       = useState('');
  const [fotos,        setFotos]        = useState<string[]>([]);

  const handlePlaca = (v: string) => {
    const cleaned = v.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setPlaca(cleaned.slice(0, 8));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 10 - fotos.length;
    const toProcess = Array.from(files).slice(0, remaining);
    toProcess.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => setFotos(prev => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleBuscarIA = async () => {
    if (!modelo || !marca || !ano) {
      showToast('error', 'Preencha modelo, marca e ano primeiro.');
      return;
    }
    try {
      const result = await buscarValores({ modelo, marca, ano: Number(ano), quilometragem: Number(quilometragem) || 0, combustivel });
      if (result) {
        setValorMercado(result.valorMercado);
        setValorFipe(result.valorFipe);
        showToast('success', 'Valores preenchidos pela IA!');
      }
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Erro ao buscar valores');
    }
  };

  const handleSave = () => {
    if (!modelo.trim()) { showToast('error', 'Modelo é obrigatório'); return; }
    if (!ano)           { showToast('error', 'Ano é obrigatório'); return; }
    if (!valorMercado)  { showToast('error', 'Valor de Mercado é obrigatório'); return; }
    if (!valorFipe)     { showToast('error', 'Valor FIPE é obrigatório'); return; }

    const tipoItem = tiposOpcoes.find(t => t.value === tipo);
    const hoje = new Date().toISOString().split('T')[0];

    const fichatecnica: FichaTecnica = {
      motor, potencia, torque, tracao, aceleracao, velocidadeMaxima,
      pesoKg: Number(pesoKg) || 0,
      capacidadeTanque: Number(capacidadeTanque) || 0,
      consumoUrbano, consumoRodovia, dimensoes,
      capacidadePassageiros: Number(capacidadePassageiros) || 0,
      outros: outros || undefined,
    };

    const veiculo: Veiculo = {
      id: generateId(),
      modelo: modelo.trim(),
      marca: marca.trim() || 'Sem marca',
      ano: Number(ano),
      placa: placa.trim(),
      quilometragem: Number(quilometragem) || 0,
      tipo,
      carroceria: tipoItem?.label || tipo,
      valorMercado: Number(valorMercado),
      valorFipe: Number(valorFipe),
      fichatecnica,
      fotos,
      favorito: false,
      historicovalorizacao: [{ data: hoje, valorMercado: Number(valorMercado), valorFipe: Number(valorFipe), fonte: 'Manual' }],
      ultimaAtualizacao: hoje,
      cor, combustivel, cambio,
      notas: notas || undefined,
    };

    onSave(veiculo);
  };

  return (
    <div className="space-y-10">

      {/* Seção 1 — Informações Básicas */}
      <section>
        <SectionTitle>Informações Básicas</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Modelo *">
            <input type="text" value={modelo} onChange={e => setModelo(e.target.value)}
              placeholder="Ex: Ferrari 488 GTB" className="sa-input" />
          </Field>
          <Field label="Marca">
            <input type="text" value={marca} onChange={e => setMarca(e.target.value)}
              list="marcas-list" placeholder="Ex: Ferrari" className="sa-input" />
            <datalist id="marcas-list">
              {marcasExistentes.map(m => <option key={m} value={m} />)}
            </datalist>
          </Field>
          <Field label="Ano *">
            <input type="number" value={ano} onChange={e => setAno(e.target.value ? Number(e.target.value) : '')}
              placeholder="2024" className="sa-input" />
          </Field>
          <Field label="Placa">
            <input type="text" value={placa} onChange={e => handlePlaca(e.target.value)}
              placeholder="ABC-1234" className="sa-input font-data" />
          </Field>
          <Field label="Cor">
            <input type="text" value={cor} onChange={e => setCor(e.target.value)}
              placeholder="Ex: Rosso Corsa" className="sa-input" />
          </Field>
          <Field label="Tipo / Carroceria">
            <select value={tipo} onChange={e => setTipo(e.target.value as TipoVeiculo)} className="sa-select">
              {tiposOpcoes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </Field>
          <Field label="Combustível">
            <select value={combustivel} onChange={e => setCombustivel(e.target.value)} className="sa-select">
              {combustivelOpcoes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Câmbio">
            <select value={cambio} onChange={e => setCambio(e.target.value)} className="sa-select">
              {cambioOpcoes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Quilometragem (km)">
            <input type="number" value={quilometragem} onChange={e => setQuilometragem(e.target.value ? Number(e.target.value) : '')}
              placeholder="0" className="sa-input font-data" />
          </Field>
          <Field label="Notas" span2>
            <textarea value={notas} onChange={e => setNotas(e.target.value)}
              placeholder="Observações sobre o veículo..." rows={2}
              className="sa-input resize-none" style={{ height: 'auto' }} />
          </Field>
        </div>
      </section>

      {/* Seção 2 — Valores */}
      <section>
        <SectionTitle>Valores</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Field label="Valor de Mercado (R$) *">
            <input type="number" value={valorMercado} onChange={e => setValorMercado(e.target.value ? Number(e.target.value) : '')}
              placeholder="Ex: 2100000" className="sa-input font-data" />
          </Field>
          <Field label="Valor FIPE (R$) *">
            <input type="number" value={valorFipe} onChange={e => setValorFipe(e.target.value ? Number(e.target.value) : '')}
              placeholder="Ex: 1980000" className="sa-input font-data" />
          </Field>
        </div>
        <button onClick={handleBuscarIA} disabled={iaLoading} className="sa-btn-ghost">
          <Bot className={`w-4 h-4 ${iaLoading ? 'animate-spin' : ''}`} />
          {iaLoading ? 'Buscando via IA...' : 'Buscar valores via IA'}
        </button>
      </section>

      {/* Seção 3 — Ficha Técnica */}
      <section>
        <SectionTitle>Ficha Técnica</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Motor">
            <input type="text" value={motor} onChange={e => setMotor(e.target.value)} placeholder="Ex: 3.9L V8 Twin-Turbo" className="sa-input" />
          </Field>
          <Field label="Potência">
            <input type="text" value={potencia} onChange={e => setPotencia(e.target.value)} placeholder="Ex: 670 cv" className="sa-input" />
          </Field>
          <Field label="Torque">
            <input type="text" value={torque} onChange={e => setTorque(e.target.value)} placeholder="Ex: 76 kgfm" className="sa-input" />
          </Field>
          <Field label="Tração">
            <select value={tracao} onChange={e => setTracao(e.target.value)} className="sa-select">
              <option value="">Selecione</option>
              {tracaoOpcoes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Aceleração 0–100 km/h">
            <input type="text" value={aceleracao} onChange={e => setAceleracao(e.target.value)} placeholder="Ex: 3,0s" className="sa-input" />
          </Field>
          <Field label="Velocidade Máxima">
            <input type="text" value={velocidadeMaxima} onChange={e => setVelocidadeMaxima(e.target.value)} placeholder="Ex: 330 km/h" className="sa-input" />
          </Field>
          <Field label="Peso (kg)">
            <input type="number" value={pesoKg} onChange={e => setPesoKg(e.target.value ? Number(e.target.value) : '')} placeholder="Ex: 1475" className="sa-input font-data" />
          </Field>
          <Field label="Tanque (litros)">
            <input type="number" value={capacidadeTanque} onChange={e => setCapacidadeTanque(e.target.value ? Number(e.target.value) : '')} placeholder="Ex: 78" className="sa-input font-data" />
          </Field>
          <Field label="Consumo Urbano">
            <input type="text" value={consumoUrbano} onChange={e => setConsumoUrbano(e.target.value)} placeholder="Ex: 5 km/l" className="sa-input" />
          </Field>
          <Field label="Consumo Rodoviário">
            <input type="text" value={consumoRodovia} onChange={e => setConsumoRodovia(e.target.value)} placeholder="Ex: 8 km/l" className="sa-input" />
          </Field>
          <Field label="Dimensões (mm)">
            <input type="text" value={dimensoes} onChange={e => setDimensoes(e.target.value)} placeholder="Ex: 4.568 x 1.952 x 1.213" className="sa-input" />
          </Field>
          <Field label="Nº de Passageiros">
            <input type="number" value={capacidadePassageiros} onChange={e => setCapacidadePassageiros(e.target.value ? Number(e.target.value) : '')} placeholder="Ex: 2" className="sa-input font-data" />
          </Field>
          <Field label="Outros" span2>
            <textarea value={outros} onChange={e => setOutros(e.target.value)} placeholder="Informações adicionais..." rows={2}
              className="sa-input resize-none" style={{ height: 'auto' }} />
          </Field>
        </div>
      </section>

      {/* Seção 4 — Fotos */}
      <section>
        <SectionTitle>
          <Camera className="w-4 h-4" />
          Fotos
          <span className="font-data text-xs font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
            {fotos.length}/10
          </span>
        </SectionTitle>

        {fotos.length < 10 && (
          <div
            className="photo-upload-zone mb-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              Arraste fotos ou clique para selecionar
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              JPEG, PNG, WebP — máx. 10 fotos
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={handlePhotoUpload}
          className="hidden"
        />

        {fotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {fotos.map((foto, index) => (
              <div key={index} className="relative rounded-xl overflow-hidden group" style={{ aspectRatio: '1' }}>
                <img src={foto} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                <button
                  onClick={() => setFotos(prev => prev.filter((_, i) => i !== index))}
                  className="absolute top-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: 'rgba(239,68,68,0.9)', color: '#fff' }}
                  aria-label="Remover foto"
                >
                  <X className="w-3 h-3" />
                </button>
                {index === 0 && (
                  <span
                    className="absolute bottom-2 left-2 text-[10px] font-medium px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff' }}
                  >
                    Capa
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Save */}
      <div className="pt-2 flex justify-end">
        <button onClick={handleSave} className="sa-btn-primary px-10 py-3 text-base">
          <Save className="w-5 h-5" />
          Salvar Veículo
        </button>
      </div>
    </div>
  );
}
