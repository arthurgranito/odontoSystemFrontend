import React, { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import Sidebar from "../components/common/Sidebar";
import api from "../services/api";
import { formatarData, formatarHora } from "../utils/formatters";
import { usePagination } from "../hooks/usePagination";
import { DEFAULT_PAGE_SIZE, CONSULTA_STATUS } from "../constants";
import type { ConsultaResponse } from "../types/Consulta";
import { 
  DollarSign, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Download,
  Filter,
  BarChart3,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { exportarConsultasExcel } from "../utils/exportUtils";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";

const Faturamento: React.FC = () => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [consultas, setConsultas] = useState<ConsultaResponse[]>([]);
  const [dataInicio, setDataInicio] = useState<Date | undefined>(startOfMonth(new Date()));
  const [dataFim, setDataFim] = useState<Date | undefined>(endOfMonth(new Date()));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [calendarInicioOpen, setCalendarInicioOpen] = useState<boolean>(false);
  const [calendarFimOpen, setCalendarFimOpen] = useState<boolean>(false);

  const fetchConsultas = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/consultas");
      setConsultas(response.data);
    } catch (error) {
      toast.error("Erro ao carregar dados de faturamento!");
      console.error('Erro ao buscar consultas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsultas();
  }, [fetchConsultas]);

  // Filtrar consultas por período e apenas concluídas
  const consultasFiltradas = useMemo(() => {
    return consultas.filter((consulta) => {
      // Apenas consultas concluídas
      if (consulta.status !== CONSULTA_STATUS.CONCLUIDA) return false;

      const consultaData = new Date(consulta.agendaDisponivel?.data || '');
      
      if (dataInicio && consultaData < dataInicio) return false;
      if (dataFim && consultaData > dataFim) return false;
      
      return true;
    });
  }, [consultas, dataInicio, dataFim]);

  // Cálculos de faturamento
  const faturamento = useMemo(() => {
    const total = consultasFiltradas.reduce((acc, consulta) =>
      acc + (consulta.valorCobrado || consulta.tipoConsulta?.preco || 0), 0
    );

    const ticketMedio = consultasFiltradas.length > 0 ? total / consultasFiltradas.length : 0;

    const valores = consultasFiltradas.map(c => c.valorCobrado || c.tipoConsulta?.preco || 0).filter(v => v > 0);
    const maiorValor = Math.max(...valores, 0);
    const menorValor = valores.length > 0 ? Math.min(...valores) : 0;

    return {
      total,
      ticketMedio,
      maiorValor,
      menorValor,
      quantidade: consultasFiltradas.length
    };
  }, [consultasFiltradas]);

  // Dados para gráficos
  const dadosGrafico = useMemo(() => {
    const agrupado: Record<string, number> = {};

    consultasFiltradas.forEach((consulta) => {
      const data = consulta.agendaDisponivel?.data || '';
      const valor = consulta.valorCobrado || consulta.tipoConsulta?.valorCobrado || 0;

      if (agrupado[data]) {
        agrupado[data] += valor;
      } else {
        agrupado[data] = valor;
      }
    });

    return Object.entries(agrupado)
      .map(([data, valor]) => ({
        data: formatarData(data),
        valor,
        dataOriginal: data
      }))
      .sort((a, b) => a.dataOriginal.localeCompare(b.dataOriginal));
  }, [consultasFiltradas]);

  // Dados por tipo de consulta
  const dadosPorTipo = useMemo(() => {
    const agrupado: Record<string, { quantidade: number; valor: number }> = {};

    consultasFiltradas.forEach((consulta) => {
      const tipo = consulta.tipoConsulta?.nome || 'Sem tipo';
      const valor = consulta.valorCobrado || consulta.tipoConsulta?.preco || 0;

      if (agrupado[tipo]) {
        agrupado[tipo].quantidade += 1;
        agrupado[tipo].valor += valor;
      } else {
        agrupado[tipo] = { quantidade: 1, valor };
      }
    });

    return Object.entries(agrupado).map(([tipo, dados]) => ({
      tipo,
      quantidade: dados.quantidade,
      valor: dados.valor
    }));
  }, [consultasFiltradas]);

  // Pagination para tabela
  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    goToNextPage,
    goToPreviousPage,
    canGoNext,
    canGoPrevious,
  } = usePagination({
    totalItems: consultasFiltradas.length,
    itemsPerPage: DEFAULT_PAGE_SIZE,
  });

  const consultasPaginadas = paginatedItems(consultasFiltradas);

  // Exportar para Excel
  const exportarExcel = () => {
    exportarConsultasExcel(consultasFiltradas, 'faturamento', true);
  };

  const COLORS = ['#0891b2', '#06b6d4', '#67e8f9', '#a7f3d0', '#fbbf24'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando faturamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <Sidebar expanded={expanded} setExpanded={setExpanded} />
      
      <main className={`flex-1 transition-all duration-300 ${expanded ? "ml-64" : "ml-16"}`}>
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Faturamento
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Análise financeira da sua clínica
              </p>
            </div>
            
            <Button onClick={exportarExcel} className="bg-green-600 hover:bg-green-700 text-white">
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Filtros de Período */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Período:
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <Popover open={calendarInicioOpen} onOpenChange={setCalendarInicioOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {dataInicio ? formatarData(dataInicio.toISOString()) : "Data início"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataInicio}
                        onSelect={(date) => {
                          setDataInicio(date);
                          setCalendarInicioOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  <span className="text-slate-400">até</span>

                  <Popover open={calendarFimOpen} onOpenChange={setCalendarFimOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {dataFim ? formatarData(dataFim.toISOString()) : "Data fim"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dataFim}
                        onSelect={(date) => {
                          setDataFim(date);
                          setCalendarFimOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const hoje = new Date();
                      setDataInicio(startOfMonth(hoje));
                      setDataFim(endOfMonth(hoje));
                    }}
                  >
                    Este mês
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const mesPassado = subMonths(new Date(), 1);
                      setDataInicio(startOfMonth(mesPassado));
                      setDataFim(endOfMonth(mesPassado));
                    }}
                  >
                    Mês passado
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500 rounded-full">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {faturamento.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-500">
                      Faturamento Total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500 rounded-full">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {faturamento.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-500">
                      Ticket Médio
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500 rounded-full">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                      {faturamento.quantidade}
                    </p>
                    <p className="text-sm text-purple-600 dark:text-purple-500">
                      Consultas Realizadas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500 rounded-full">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                      {faturamento.maiorValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-sm text-orange-600 dark:text-orange-500">
                      Maior Valor
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico de Faturamento por Dia */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">
                  Faturamento por Dia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dadosGrafico}>
                      <XAxis 
                        dataKey="data" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        formatter={(value: number) => [
                          value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                          'Faturamento'
                        ]}
                      />
                      <Bar dataKey="valor" fill="#0891b2" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico por Tipo de Consulta */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">
                  Faturamento por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dadosPorTipo}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ tipo, valor }) => `${tipo}: ${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="valor"
                      >
                        {dadosPorTipo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [
                          value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                          'Faturamento'
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabela Detalhada */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">
                Detalhamento das Consultas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Horário</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Tipo de Consulta</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {consultasPaginadas.map((consulta) => (
                      <TableRow key={consulta.id}>
                        <TableCell>
                          {formatarData(consulta.agendaDisponivel?.data || '')}
                        </TableCell>
                        <TableCell>
                          {formatarHora(consulta.agendaDisponivel?.horaInicio || '')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {consulta.paciente?.nome || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {consulta.tipoConsulta?.nome || 'N/A'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {(consulta.valorCobrado || consulta.tipoConsulta?.preco || 0).toLocaleString('pt-BR', { 
                            style: 'currency', 
                            currency: 'BRL' 
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Mostrando {((currentPage - 1) * DEFAULT_PAGE_SIZE) + 1} a {Math.min(currentPage * DEFAULT_PAGE_SIZE, consultasFiltradas.length)} de {consultasFiltradas.length} consultas
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={!canGoPrevious}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={!canGoNext}
                    >
                      Próxima
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Faturamento;