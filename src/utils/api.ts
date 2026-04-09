// Base URL do backend. Em dev, vazio (usa o proxy do Vite).
// Em produção, defina VITE_API_URL com a URL HTTPS do Render (ex: https://scolfaro-api.onrender.com)
const rawApiUrl = import.meta.env.VITE_API_URL ?? '';

// Nunca use HTTP quando a página está em HTTPS (mixed content).
// Se a URL configurada for HTTP e a página for HTTPS, ignora a URL e usa caminho relativo.
export const API_BASE =
  rawApiUrl.startsWith('http://') && typeof location !== 'undefined' && location.protocol === 'https:'
    ? ''
    : rawApiUrl;
