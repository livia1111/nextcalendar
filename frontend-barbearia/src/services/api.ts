// Serviços de API do projeto barbearia
// Ex: agendamentos, clientes, barbeiros
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000', // ajuste conforme o backend
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});
