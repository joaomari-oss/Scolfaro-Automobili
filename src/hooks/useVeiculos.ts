import { useState, useEffect } from 'react';
import { veiculosDB } from '../services/veiculosDB';
import { atualizarValoresVeiculo } from './useIA';
import type { Veiculo, Gasto } from '../types/veiculo';

export function useVeiculos() {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [erro, setErro]         = useState<string | null>(null);

  useEffect(() => {
    veiculosDB.listar()
      .then(setVeiculos)
      .catch(e => setErro(e.message))
      .finally(() => setLoading(false));
  }, []);

  const adicionar = async (v: Omit<Veiculo, 'id'>): Promise<Veiculo> => {
    const novo = await veiculosDB.adicionar(v);
    setVeiculos(prev => [novo, ...prev]);
    return novo;
  };

  const atualizar = async (id: string, dados: Partial<Veiculo>): Promise<Veiculo> => {
    const atualizado = await veiculosDB.atualizar(id, dados);
    setVeiculos(prev => prev.map(v => v.id === id ? atualizado : v));
    return atualizado;
  };

  const remover = async (id: string): Promise<void> => {
    await veiculosDB.remover(id);
    setVeiculos(prev => prev.filter(v => v.id !== id));
  };

  const toggleFavorito = async (id: string): Promise<void> => {
    const v = veiculos.find(v => v.id === id);
    if (!v) return;
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
      await veiculosDB.atualizarValores(
        id,
        resultado.valorFipe    ?? veiculo.valorFipe,
        resultado.valorMercado ?? veiculo.valorMercado,
        veiculo.historicovalorizacao,
        resultado.codigoFipe
      );
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
    await veiculosDB.atualizar(veiculoId, { gastos: novosGastos });
    setVeiculos(prev => prev.map(v =>
      v.id === veiculoId ? { ...v, gastos: novosGastos } : v
    ));
  };

  const editarGasto = async (veiculoId: string, gastoId: string, dados: Omit<Gasto, 'id' | 'createdAt'>): Promise<void> => {
    const v = veiculos.find(v => v.id === veiculoId);
    if (!v) return;
    const novosGastos = v.gastos.map(g => g.id === gastoId ? { ...g, ...dados } : g);
    await veiculosDB.atualizar(veiculoId, { gastos: novosGastos });
    setVeiculos(prev => prev.map(v =>
      v.id === veiculoId ? { ...v, gastos: novosGastos } : v
    ));
  };

  const removerGasto = async (veiculoId: string, gastoId: string): Promise<void> => {
    const v = veiculos.find(v => v.id === veiculoId);
    if (!v) return;
    const novosGastos = v.gastos.filter(g => g.id !== gastoId);
    await veiculosDB.atualizar(veiculoId, { gastos: novosGastos });
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
