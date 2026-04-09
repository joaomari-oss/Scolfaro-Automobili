import { useState, useCallback } from 'react';
import { veiculosDB } from '../services/veiculosDB';
import { supabaseDisponivel } from '../lib/supabase';
import { atualizarValoresVeiculo } from './useIA';
import { getVeiculos, setVeiculos as saveVeiculos } from '../utils/storage';
import { veiculosIniciais } from '../data/mockData';
import type { Veiculo, Gasto } from '../types/veiculo';

function normalizarVeiculo(v: Partial<Veiculo> & { id: string }): Veiculo {
  return {
    ...v,
    fotos: v.fotos ?? [],
    favorito: v.favorito ?? false,
    gastos: v.gastos ?? [],
    historicovalorizacao: v.historicovalorizacao ?? [],
    fichatecnica: v.fichatecnica ?? {},
    notas: v.notas ?? '',
    placa: v.placa ?? '',
    cor: v.cor ?? '',
    combustivel: v.combustivel ?? '',
    cambio: v.cambio ?? '',
    ultimaAtualizacao: v.ultimaAtualizacao ?? new Date().toISOString(),
  } as Veiculo;
}

function carregarLocal(): Veiculo[] {
  try {
    const raw = getVeiculos();
    if (raw) return (JSON.parse(raw) as Veiculo[]).map(normalizarVeiculo);
  } catch { /* ignora */ }
  return veiculosIniciais.map(normalizarVeiculo);
}

export function useVeiculos() {
  const usandoSupabase = supabaseDisponivel;

  const [veiculos, setVeiculosState] = useState<Veiculo[]>(() =>
    usandoSupabase ? [] : carregarLocal()
  );
  const [loading, setLoading] = useState(usandoSupabase);
  const [erro, setErro]       = useState<string | null>(null);

  // Salva no localStorage sempre que muda (modo local)
  const setVeiculos = useCallback((fn: Veiculo[] | ((prev: Veiculo[]) => Veiculo[])) => {
    setVeiculosState(prev => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      if (!usandoSupabase) saveVeiculos(JSON.stringify(next));
      return next;
    });
  }, [usandoSupabase]);

  // Se Supabase disponível, carrega do banco na inicialização
  useState(() => {
    if (!usandoSupabase) return;
    veiculosDB.listar()
      .then(data => setVeiculosState(data))
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  });

  const adicionar = async (v: Omit<Veiculo, 'id'>): Promise<Veiculo> => {
    if (usandoSupabase) {
      const novo = await veiculosDB.adicionar(v);
      setVeiculos(prev => [novo, ...prev]);
      return novo;
    }
    const novo: Veiculo = normalizarVeiculo({ ...v, id: crypto.randomUUID() });
    setVeiculos(prev => [novo, ...prev]);
    return novo;
  };

  const atualizar = async (id: string, dados: Partial<Veiculo>): Promise<Veiculo> => {
    if (usandoSupabase) {
      const atualizado = await veiculosDB.atualizar(id, dados);
      setVeiculos(prev => prev.map(v => v.id === id ? atualizado : v));
      return atualizado;
    }
    let atualizado!: Veiculo;
    setVeiculos(prev => prev.map(v => {
      if (v.id !== id) return v;
      atualizado = normalizarVeiculo({ ...v, ...dados, id });
      return atualizado;
    }));
    return atualizado;
  };

  const remover = async (id: string): Promise<void> => {
    if (usandoSupabase) await veiculosDB.remover(id);
    setVeiculos(prev => prev.filter(v => v.id !== id));
  };

  const toggleFavorito = async (id: string): Promise<void> => {
    const v = veiculos.find(v => v.id === id);
    if (!v) return;
    if (usandoSupabase) await veiculosDB.toggleFavorito(id, !v.favorito);
    setVeiculos(prev => prev.map(v => v.id === id ? { ...v, favorito: !v.favorito } : v));
  };

  const atualizarValores = async (id: string): Promise<{
    erros: string[];
    iaUsada?: 'gemini' | 'groq';
  }> => {
    const veiculo = veiculos.find(v => v.id === id);
    if (!veiculo) return { erros: ['Veículo não encontrado'] };

    const resultado = await atualizarValoresVeiculo(veiculo);

    if (resultado.valorFipe || resultado.valorMercado) {
      if (usandoSupabase) {
        await veiculosDB.atualizarValores(
          id,
          resultado.valorFipe    ?? veiculo.valorFipe,
          resultado.valorMercado ?? veiculo.valorMercado,
          veiculo.historicovalorizacao,
          resultado.codigoFipe
        );
      }
      const fonte = resultado.iaUsada === 'groq'
        ? 'Groq compound-beta'
        : 'Gemini 2.5 Flash + Google Search';
      setVeiculos(prev => prev.map(v => v.id === id ? {
        ...v,
        valorFipe:    resultado.valorFipe    ?? v.valorFipe,
        valorMercado: resultado.valorMercado ?? v.valorMercado,
        codigoFipe:   resultado.codigoFipe   ?? v.codigoFipe,
        ultimaAtualizacao: new Date().toISOString(),
        historicovalorizacao: [
          ...v.historicovalorizacao,
          {
            data: new Date().toISOString(),
            valorMercado: resultado.valorMercado ?? v.valorMercado,
            valorFipe:    resultado.valorFipe    ?? v.valorFipe,
            fonte,
          }
        ],
      } : v));
    }

    return { erros: resultado.erros, iaUsada: resultado.iaUsada };
  };

  const adicionarGasto = async (veiculoId: string, gasto: Omit<Gasto, 'id' | 'createdAt'>): Promise<void> => {
    const v = veiculos.find(v => v.id === veiculoId);
    if (!v) return;
    const novoGasto: Gasto = { ...gasto, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const novosGastos = [...v.gastos, novoGasto];
    if (usandoSupabase) await veiculosDB.atualizar(veiculoId, { gastos: novosGastos });
    setVeiculos(prev => prev.map(v =>
      v.id === veiculoId ? { ...v, gastos: novosGastos } : v
    ));
  };

  const editarGasto = async (veiculoId: string, gastoId: string, dados: Omit<Gasto, 'id' | 'createdAt'>): Promise<void> => {
    const v = veiculos.find(v => v.id === veiculoId);
    if (!v) return;
    const novosGastos = v.gastos.map(g => g.id === gastoId ? { ...g, ...dados } : g);
    if (usandoSupabase) await veiculosDB.atualizar(veiculoId, { gastos: novosGastos });
    setVeiculos(prev => prev.map(v =>
      v.id === veiculoId ? { ...v, gastos: novosGastos } : v
    ));
  };

  const removerGasto = async (veiculoId: string, gastoId: string): Promise<void> => {
    const v = veiculos.find(v => v.id === veiculoId);
    if (!v) return;
    const novosGastos = v.gastos.filter(g => g.id !== gastoId);
    if (usandoSupabase) await veiculosDB.atualizar(veiculoId, { gastos: novosGastos });
    setVeiculos(prev => prev.map(v =>
      v.id === veiculoId ? { ...v, gastos: novosGastos } : v
    ));
  };

  return {
    veiculos, loading, erro,
    adicionar, atualizar, remover,
    toggleFavorito, atualizarValores,
    adicionarGasto, editarGasto, removerGasto,
  };
}
