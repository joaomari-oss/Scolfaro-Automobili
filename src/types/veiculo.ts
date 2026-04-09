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
}

export type VeiculoEditavel = Omit<Veiculo, 'id' | 'historicovalorizacao' | 'favorito' | 'ultimaAtualizacao'>;
