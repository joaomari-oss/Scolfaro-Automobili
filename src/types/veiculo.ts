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
  fichatecnica: FichaTecnica;
  fotos: string[];
  favorito: boolean;
  historicovalorizacao: HistoricoValor[];
  ultimaAtualizacao: string;
  cor: string;
  combustivel: string;
  cambio: string;
  notas?: string;
}
