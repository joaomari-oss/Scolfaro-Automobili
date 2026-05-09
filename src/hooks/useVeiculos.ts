import { useState, useEffect } from 'react';
import { veiculosDB } from '../services/veiculosDB';
import { supabaseDisponivel } from '../lib/supabase';
import { atualizarValoresVeiculo } from './useIA';
import type { Veiculo, Gasto } from '../types/veiculo';

const LS_KEY = 'scolfaro_veiculos';
const LS_MIGRATED_KEY = 'scolfaro_migrado_supabase';
const SUPABASE_TIMEOUT_MS = 8_000;

/** Rejeita se a promise não resolver dentro do prazo */
function comTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout após ${ms / 1000}s`)), ms)
    ),
  ]);
}

function lsListar(): Veiculo[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? '[]'); }
  catch { return []; }
}
function lsSalvar(lista: Veiculo[]): void {
  localStorage.setItem(LS_KEY, JSON.stringify(lista));
}

export function useVeiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [erro] = useState<string | null>(null);

  useEffect(() => {
    if (!supabaseDisponivel) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVeiculos(lsListar());
      setLoading(false);
      return;
    }

    const migrarLocalStorage = async (remoto: Veiculo[]) => {
      const jasMigrado = localStorage.getItem(LS_MIGRATED_KEY);
      if (jasMigrado) return remoto;
      const local = lsListar();
      if (local.length === 0) {
        localStorage.setItem(LS_MIGRATED_KEY, '1');
        return remoto;
      }
      // Migra veículos locais que não existem no Supabase (compara por placa ou modelo+ano)
      const novos: Veiculo[] = [];
      for (const v of local) {
        const jáExiste = remoto.some(r =>
          (v.placa && r.placa && v.placa === r.placa) ||
          (r.modelo === v.modelo && r.ano === v.ano && r.marca === v.marca)
        );
        if (!jáExiste) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id: _id, ...semId } = v;
            const inserido = await veiculosDB.adicionar(semId);
            novos.push(inserido);
          } catch {
            // falha silenciosa em migração individual
          }
        }
      }
      localStorage.setItem(LS_MIGRATED_KEY, '1');
      localStorage.removeItem(LS_KEY); // limpa localStorage após migração
      return [...novos, ...remoto];
    };

    comTimeout(veiculosDB.listar(), SUPABASE_TIMEOUT_MS)
      .then(remoto => migrarLocalStorage(remoto))
      .then(lista => setVeiculos(lista))
      .catch(e => {
        console.error('Supabase erro ao listar:', e);
        setVeiculos(lsListar());
      })
      .finally(() => setLoading(false));
  }, []);

  const adicionar = async (v: Omit<Veiculo, 'id'>): Promise<Veiculo> => {
    if (!supabaseDisponivel) {
      const novo: Veiculo = { ...v, id: crypto.randomUUID() };
      setVeiculos(prev => { const next = [novo, ...prev]; lsSalvar(next); return next; });
      return novo;
    }
    // Supabase configurado: deixa o erro propagar — não salvar localmente
    // silenciosamente pois o dado não estaria sincronizado entre dispositivos
    const novo = await veiculosDB.adicionar(v);
    setVeiculos(prev => [novo, ...prev]);
    return novo;
  };

  const atualizar = async (id: string, dados: Partial<Veiculo>): Promise<Veiculo> => {
    if (!supabaseDisponivel) {
      let atualizado!: Veiculo;
      setVeiculos(prev => {
        const next = prev.map(v => v.id === id ? (atualizado = { ...v, ...dados }) : v);
        lsSalvar(next);
        return next;
      });
      return atualizado;
    }
    const atualizado = await veiculosDB.atualizar(id, dados);
    setVeiculos(prev => prev.map(v => v.id === id ? atualizado : v));
    return atualizado;
  };

  const remover = async (id: string): Promise<void> => {
    if (!supabaseDisponivel) {
      setVeiculos(prev => { const next = prev.filter(v => v.id !== id); lsSalvar(next); return next; });
      return;
    }
    await veiculosDB.remover(id);
    setVeiculos(prev => prev.filter(v => v.id !== id));
  };

  const toggleFavorito = async (id: string): Promise<void> => {
    const v = veiculos.find(v => v.id === id);
    if (!v) return;
    if (!supabaseDisponivel) {
      setVeiculos(prev => {
        const next = prev.map(v => v.id === id ? { ...v, favorito: !v.favorito } : v);
        lsSalvar(next);
        return next;
      });
      return;
    }
    await veiculosDB.toggleFavorito(id, !v.favorito);
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
      const fonte = resultado.iaUsada === 'groq'
        ? 'Groq compound-beta'
        : 'Gemini 2.5 Flash + Google Search';
      if (supabaseDisponivel) {
        await veiculosDB.atualizarValores(
          id,
          resultado.valorFipe    ?? veiculo.valorFipe,
          resultado.valorMercado ?? veiculo.valorMercado,
          veiculo.historicovalorizacao,
          resultado.codigoFipe
        );
      }
      setVeiculos(prev => {
        const next = prev.map(v => v.id === id ? {
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
        } : v);
        if (!supabaseDisponivel) lsSalvar(next);
        return next;
      });
    }

    return { erros: resultado.erros, iaUsada: resultado.iaUsada };
  };

  const adicionarGasto = async (veiculoId: string, gasto: Omit<Gasto, 'id' | 'createdAt'>): Promise<void> => {
    const v = veiculos.find(v => v.id === veiculoId);
    if (!v) return;
    const novoGasto: Gasto = { ...gasto, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    const novosGastos = [...v.gastos, novoGasto];
    if (!supabaseDisponivel) {
      setVeiculos(prev => { const next = prev.map(v => v.id === veiculoId ? { ...v, gastos: novosGastos } : v); lsSalvar(next); return next; });
      return;
    }
    await veiculosDB.atualizar(veiculoId, { gastos: novosGastos });
    setVeiculos(prev => prev.map(v => v.id === veiculoId ? { ...v, gastos: novosGastos } : v));
  };

  const editarGasto = async (veiculoId: string, gastoId: string, dados: Omit<Gasto, 'id' | 'createdAt'>): Promise<void> => {
    const v = veiculos.find(v => v.id === veiculoId);
    if (!v) return;
    const novosGastos = v.gastos.map(g => g.id === gastoId ? { ...g, ...dados } : g);
    if (!supabaseDisponivel) {
      setVeiculos(prev => { const next = prev.map(v => v.id === veiculoId ? { ...v, gastos: novosGastos } : v); lsSalvar(next); return next; });
      return;
    }
    await veiculosDB.atualizar(veiculoId, { gastos: novosGastos });
    setVeiculos(prev => prev.map(v => v.id === veiculoId ? { ...v, gastos: novosGastos } : v));
  };

  const removerGasto = async (veiculoId: string, gastoId: string): Promise<void> => {
    const v = veiculos.find(v => v.id === veiculoId);
    if (!v) return;
    const novosGastos = v.gastos.filter(g => g.id !== gastoId);
    if (!supabaseDisponivel) {
      setVeiculos(prev => { const next = prev.map(v => v.id === veiculoId ? { ...v, gastos: novosGastos } : v); lsSalvar(next); return next; });
      return;
    }
    await veiculosDB.atualizar(veiculoId, { gastos: novosGastos });
    setVeiculos(prev => prev.map(v => v.id === veiculoId ? { ...v, gastos: novosGastos } : v));
  };

  return {
    veiculos, loading, erro,
    adicionar, atualizar, remover,
    toggleFavorito, atualizarValores,
    adicionarGasto, editarGasto, removerGasto,
  };
}
