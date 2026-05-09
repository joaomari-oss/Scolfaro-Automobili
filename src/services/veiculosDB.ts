import { supabase, supabaseDisponivel } from '../lib/supabase';
import type { Veiculo, Agendamento } from '../types/veiculo';

function requireSupabase() {
  if (!supabaseDisponivel) throw new Error('Supabase não configurado');
}

// snake_case DB → camelCase TS
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fromDB = (r: any): Veiculo => ({
  id: r.id, modelo: r.modelo, marca: r.marca, ano: r.ano,
  placa: r.placa ?? '', quilometragem: r.quilometragem ?? 0,
  tipo: r.tipo, carroceria: r.carroceria ?? r.tipo,
  valorMercado: Number(r.valor_mercado ?? 0),
  valorFipe: Number(r.valor_fipe ?? 0),
  codigoFipe: r.codigo_fipe,
  fichatecnica: r.ficha_tecnica ?? {},
  fotos: r.fotos ?? [], favorito: r.favorito ?? false,
  historicovalorizacao: r.historico_valorizacao ?? [],
  ultimaAtualizacao: r.ultima_atualizacao ?? new Date().toISOString(),
  cor: r.cor ?? '', combustivel: r.combustivel ?? '',
  cambio: r.cambio ?? '', notas: r.notas ?? '',
  gastos: r.gastos ?? [],
  // Novos campos
  proprietarios: r.proprietarios ?? [],
  seguro: r.seguro ?? undefined,
  tags: r.tags ?? [],
  dataCompra: r.data_compra ?? undefined,
  precoCompra: r.preco_compra ? Number(r.preco_compra) : undefined,
  dataVenda: r.data_venda ?? undefined,
  precoVenda: r.preco_venda ? Number(r.preco_venda) : undefined,
});

// camelCase TS → snake_case DB  (undefined values omitted so inserts work with old schemas)
const toDB = (v: Partial<Veiculo>): Record<string, unknown> => {
  const raw: Record<string, unknown> = {
    modelo: v.modelo, marca: v.marca, ano: v.ano, placa: v.placa,
    quilometragem: v.quilometragem, tipo: v.tipo, carroceria: v.carroceria,
    valor_mercado: v.valorMercado, valor_fipe: v.valorFipe,
    codigo_fipe: v.codigoFipe, ficha_tecnica: v.fichatecnica,
    fotos: v.fotos, favorito: v.favorito,
    historico_valorizacao: v.historicovalorizacao,
    ultima_atualizacao: v.ultimaAtualizacao,
    cor: v.cor, combustivel: v.combustivel, cambio: v.cambio,
    notas: v.notas, gastos: v.gastos,
    // Novos campos — omitidos automaticamente quando undefined
    proprietarios: v.proprietarios,
    seguro: v.seguro,
    tags: v.tags,
    data_compra: v.dataCompra,
    preco_compra: v.precoCompra,
    data_venda: v.dataVenda,
    preco_venda: v.precoVenda,
  };
  // Remove chaves undefined para não enviar colunas inexistentes ao Supabase
  return Object.fromEntries(Object.entries(raw).filter(([, val]) => val !== undefined));
};

export const veiculosDB = {
  async listar(): Promise<Veiculo[]> {
    requireSupabase();
    const { data, error } = await supabase
      .from('veiculos').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(fromDB);
  },

  async adicionar(v: Omit<Veiculo, 'id'>): Promise<Veiculo> {
    requireSupabase();
    const { data, error } = await supabase.from('veiculos')
      .insert(toDB(v)).select().single();
    if (error) throw new Error(error.message);
    return fromDB(data);
  },

  async atualizar(id: string, v: Partial<Veiculo>): Promise<Veiculo> {
    requireSupabase();
    const { data, error } = await supabase.from('veiculos')
      .update(toDB(v)).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    return fromDB(data);
  },

  async remover(id: string): Promise<void> {
    requireSupabase();
    const { error } = await supabase.from('veiculos').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async toggleFavorito(id: string, favorito: boolean): Promise<void> {
    requireSupabase();
    const { error } = await supabase.from('veiculos')
      .update({ favorito }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async atualizarValores(
    id: string, valorFipe: number, valorMercado: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    historicoAtual: any[], codigoFipe?: string
  ): Promise<void> {
    requireSupabase();
    const novaEntrada = {
      data: new Date().toISOString(), valorMercado, valorFipe,
      fonte: 'FIPE Oficial + IA Web Search',
    };
    const { error } = await supabase.from('veiculos').update({
      valor_fipe: valorFipe, valor_mercado: valorMercado,
      codigo_fipe: codigoFipe,
      historico_valorizacao: [...historicoAtual, novaEntrada],
      ultima_atualizacao: new Date().toISOString(),
    }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  // Migração única do localStorage para o banco
  async migrarDoLocalStorage(): Promise<{ migrados: number; erros: number }> {
    requireSupabase();
    const raw = localStorage.getItem('scolfaro_veiculos');
    if (!raw) return { migrados: 0, erros: 0 };
    const lista: Veiculo[] = JSON.parse(raw);
    let migrados = 0, erros = 0;
    for (const v of lista) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, ...semId } = v;
        await this.adicionar(semId);
        migrados++;
      } catch { erros++; }
    }
    if (migrados > 0) {
      localStorage.setItem('scolfaro_veiculos_backup', raw);
      localStorage.removeItem('scolfaro_veiculos');
    }
    return { migrados, erros };
  },
};

// ── AGENDAMENTOS DB ─────────────────────────────────────────────────────────

const agendamentoDB = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fromDB: (r: any): Agendamento => ({
    id: r.id,
    veiculoId: r.veiculo_id,
    tipo: r.tipo ?? '',
    descricao: r.descricao,
    dataAgendada: r.data_agendada,
    dataConcluido: r.data_concluido ?? undefined,
    status: r.status,
    custo: r.custo ? Number(r.custo) : undefined,
    observacoes: r.observacoes ?? undefined,
    createdAt: r.created_at,
  }),

  toDB: (ag: Agendamento) => ({
    id: ag.id,
    veiculo_id: ag.veiculoId,
    tipo: ag.tipo || null,
    descricao: ag.descricao,
    data_agendada: ag.dataAgendada,
    data_concluido: ag.dataConcluido ?? null,
    status: ag.status,
    custo: ag.custo ?? null,
    observacoes: ag.observacoes ?? null,
  }),
};

export const agendamentosDB = {
  async listar(): Promise<Agendamento[]> {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .order('data_agendada', { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(agendamentoDB.fromDB);
  },

  async salvar(ag: Agendamento): Promise<Agendamento> {
    const { data, error } = await supabase
      .from('agendamentos')
      .upsert(agendamentoDB.toDB(ag), { onConflict: 'id' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return agendamentoDB.fromDB(data);
  },

  async remover(id: string): Promise<void> {
    const { error } = await supabase
      .from('agendamentos')
      .delete()
      .eq('id', id);
    if (error) throw new Error(error.message);
  },
};
