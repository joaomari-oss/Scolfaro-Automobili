// Base URL do backend. Em dev, vazio (usa o proxy do Vite).
// Em produção, defina VITE_API_URL com a URL do Render (ex: https://scolfaro-api.onrender.com)
export const API_BASE = import.meta.env.VITE_API_URL ?? '';
