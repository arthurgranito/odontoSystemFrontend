export interface Escala {
  id: number;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  intervaloMinutos: number;
  ativo: boolean;
}

export interface EscalaFormData {
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
  intervaloMinutos: number;
}

export type DiaSemana = 
  | 'SEGUNDA'
  | 'TERCA'
  | 'QUARTA'
  | 'QUINTA'
  | 'SEXTA'
  | 'SABADO'
  | 'DOMINGO';

export interface HorarioDisponivel {
  hora: string;
  disponivel: boolean;
}