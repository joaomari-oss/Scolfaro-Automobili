export type TipoVeiculo =
  | 'sedan'
  | 'suv'
  | 'esportivo'
  | 'picape'
  | 'hatch'
  | 'conversivel'
  | 'moto'
  | 'van'
  | 'utilitario'
  | 'classico';

export type TipoGasto = 'investimento' | 'manutencao';

export interface Gasto {
  id: string;
  tipo: TipoGasto;
  descricao: string;
  valor: number;
  data: string;
  createdAt: string;
}

export interface FichaTecnica {
  motor: string;
  potencia: string;
  torque: string;
  tracao: string;
  aceleracao: string;
  velocidadeMaxima: string;
  pesoKg: number;
  capacidadeTanque: number;
  consumoUrbano: string;
  consumoRodovia: string;
  dimensoes: string;
  capacidadePassageiros: number;
  outros?: string;
}

export interface HistoricoValor {
  data: string;
  valorMercado: number;
  valorFipe: number;
  fonte: string;
}

// ── B1: Agenda de Manutenção ──────────────────────────────────
export type StatusAgendamento = 'pendente' | 'concluido' | 'atrasado';
export interface Agendamento {
  id: string;
  veiculoId: string;
  tipo: string;
  descricao: string;
  dataAgendada: string;
  dataConcluido?: string;
  status: StatusAgendamento;
  custo?: number;
  observacoes?: string;
  createdAt: string;
}

// ── B3: Histórico de Proprietários ───────────────────────────
export interface Proprietario {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim?: string;
  observacoes?: string;
}

// ── B4: Seguro ────────────────────────────────────────────────
export interface Seguro {
  id: string;
  seguradora: string;
  numeroApolice: string;
  valorCobertura: number;
  premio: number;
  vigenciaInicio: string;
  vigenciaFim: string;
  observacoes?: string;
}

// ── C4: Tags personalizadas ───────────────────────────────────
export interface Tag {
  id: string;
  nome: string;
  cor: string;
}

export interface Veiculo {
  id: string;
  modelo: string;
  marca: string;
  ano: number;
  placa: string;
  quilometragem: number;
  tipo: TipoVeiculo;
  carroceria: string;
  valorMercado: number;
  valorFipe: number;
  codigoFipe?: string;
  fichatecnica: FichaTecnica;
  fotos: string[];
  favorito: boolean;
  historicovalorizacao: HistoricoValor[];
  ultimaAtualizacao: string;
  cor: string;
  combustivel: string;
  cambio: string;
  notas?: string;
  gastos: Gasto[];
  // B3
  proprietarios?: Proprietario[];
  // B4
  seguro?: Seguro;
  // C4
  tags?: Tag[];
  // A3 – datas de compra/venda para ROI
  dataCompra?: string;
  precoCompra?: number;
  dataVenda?: string;
  precoVenda?: number;
}

export type VeiculoEditavel = Omit<Veiculo, 'id' | 'historicovalorizacao' | 'favorito' | 'ultimaAtualizacao'>;

