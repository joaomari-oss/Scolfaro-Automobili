import { useState } from 'react';

interface IAValores {
  valorMercado: number;
  valorFipe: number;
  observacao: string;
}

export function useIA() {
  const [loading, setLoading] = useState(false);

  const buscarValores = async (params: {
    modelo: string;
    marca: string;
    ano: number;
    quilometragem: number;
    combustivel: string;
  }): Promise<IAValores | null> => {
    setLoading(true);
    try {
      const response = await fetch('/api/ia/buscar-valores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error ?? `Erro ${response.status} ao consultar IA`);
      }

      return (await response.json()) as IAValores;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { buscarValores, loading };
}
