import { useState, useEffect, useCallback } from 'react';
import type { Veiculo } from '../types/veiculo';
import { getVeiculos, setVeiculos } from '../utils/storage';
import { veiculosIniciais } from '../data/mockData';

export function useVeiculos() {
  const [veiculos, setVeiculosState] = useState<Veiculo[]>([]);

  useEffect(() => {
    const stored = getVeiculos();
    if (stored) {
      try {
        setVeiculosState(JSON.parse(stored));
      } catch {
        setVeiculosState(veiculosIniciais);
        setVeiculos(JSON.stringify(veiculosIniciais));
      }
    } else {
      setVeiculosState(veiculosIniciais);
      setVeiculos(JSON.stringify(veiculosIniciais));
    }
  }, []);

  const persist = useCallback((updated: Veiculo[]) => {
    setVeiculosState(updated);
    setVeiculos(JSON.stringify(updated));
  }, []);

  const addVeiculo = useCallback((veiculo: Veiculo) => {
    setVeiculosState(prev => {
      const updated = [...prev, veiculo];
      setVeiculos(JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateVeiculo = useCallback((id: string, data: Partial<Veiculo>) => {
    setVeiculosState(prev => {
      const updated = prev.map(v => (v.id === id ? { ...v, ...data } : v));
      setVeiculos(JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeVeiculo = useCallback((id: string) => {
    setVeiculosState(prev => {
      const updated = prev.filter(v => v.id !== id);
      setVeiculos(JSON.stringify(updated));
      return updated;
    });
  }, []);

  const toggleFavorito = useCallback((id: string) => {
    setVeiculosState(prev => {
      const updated = prev.map(v =>
        v.id === id ? { ...v, favorito: !v.favorito } : v
      );
      setVeiculos(JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { veiculos, addVeiculo, updateVeiculo, removeVeiculo, toggleFavorito, persist };
}
