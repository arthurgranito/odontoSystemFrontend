// API Configuration
export const API_BASE_URL = 'https://solid-dela-arthurgranito-4d00153f.koyeb.app';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const DASHBOARD_CONSULTAS_PAGE_SIZE = 3;
export const PACIENTES_PAGE_SIZE = 10;

// Date and Time Formats
export const DATE_FORMAT_BR = 'DD/MM/YYYY';
export const DATE_FORMAT_ISO = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:mm';

// Status
export const CONSULTA_STATUS = {
  AGENDADA: 'AGENDADA',
  CONCLUIDA: 'CONCLUIDA',
  CANCELADA: 'CANCELADA',
} as const;

// Days of Week
export const DIAS_SEMANA = {
  SEGUNDA: 'SEGUNDA',
  TERCA: 'TERCA',
  QUARTA: 'QUARTA',
  QUINTA: 'QUINTA',
  SEXTA: 'SEXTA',
  SABADO: 'SABADO',
  DOMINGO: 'DOMINGO',
} as const;

export const DIAS_SEMANA_LABELS = {
  SEGUNDA: 'Segunda-feira',
  TERCA: 'Terça-feira',
  QUARTA: 'Quarta-feira',
  QUINTA: 'Quinta-feira',
  SEXTA: 'Sexta-feira',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'Ocorreu um erro inesperado',
  NETWORK: 'Erro de conexão com o servidor',
  UNAUTHORIZED: 'Acesso não autorizado',
  VALIDATION: 'Dados inválidos',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Criado com sucesso',
  UPDATED: 'Atualizado com sucesso',
  DELETED: 'Excluído com sucesso',
  LOGIN: 'Login realizado com sucesso',
  LOGOUT: 'Logout realizado com sucesso',
} as const;