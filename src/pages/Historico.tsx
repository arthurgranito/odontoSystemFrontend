import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import Sidebar from "../components/common/Sidebar";
import ConsultaAgendadaCard from "../components/common/ConsultaAgendadaCard";
import api from "../services/api";
import { formatarData } from "../utils/formatters";
import { usePagination } from "../hooks/usePagination";
import { exportarConsultasExcel } from "../utils/exportUtils";
import { DEFAULT_PAGE_SIZE, CONSULTA_STATUS } from "../constants";
import type { ConsultaResponse } from "../types/Consulta";
import { 
  History, 
  Search, 
  Calendar as CalendarIcon, 
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";

const Historico: React.FC = () => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [consultas, setConsultas] = useState<ConsultaResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dataFiltro, setDataFiltro] = useState<Date | undefined>();
  const [statusFiltro, setStatusFiltro] = useState<string>("todas");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);

  // Função para exportar histórico
  const exportarHistorico = () => {
    exportarConsultasExcel(consultasFiltradas, 'historico_consultas', true);
  };

  const fetchConsultas = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/consultas");
      setConsultas(response.data);
    } catch (error) {
      toast.error("Erro ao carregar histórico!");
      console.error('Erro ao buscar consultas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsultas();
  }, [fetchConsultas]);

  // Filtros aplicados - apenas consultas finalizadas (concluídas ou canceladas)
  const consultasFiltradas = consultas.filter((consulta) => {
    // Apenas consultas finalizadas
    if (consulta.status === CONSULTA_STATUS.AGENDADA) return false;

    // Filtro por data
    if (dataFiltro) {
      const consultaData = consulta.agendaDisponivel?.data;
      const filtroData = dataFiltro.toISOString().slice(0, 10);
      if (consultaData !== filtroData) return false;
    }

    // Filtro por status
    if (statusFiltro !== "todas") {
      if (statusFiltro === "concluidas" && consulta.status !== CONSULTA_STATUS.CONCLUIDA) return false;
      if (statusFiltro === "canceladas" && consulta.status !== CONSULTA_STATUS.CANCELADA) return false;
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      const termo = searchTerm.toLowerCase();
      const nomeMatch = consulta.paciente?.nome?.toLowerCase().includes(termo);
      const tipoMatch = consulta.tipoConsulta?.nome?.toLowerCase().includes(termo);
      if (!nomeMatch && !tipoMatch) return false;
    }

    return true;
  });

  // Ordenar por data mais recente
  const consultasOrdenadas = consultasFiltradas.sort((a, b) => {
    const dataA = new Date(a.dataConclusao || a.agendaDisponivel?.data || '');
    const dataB = new Date(b.dataConclusao || b.agendaDisponivel?.data || '');
    return dataB.getTime() - dataA.getTime();
  });

  // Estatísticas
  const stats = {
    total: consultasFiltradas.length,
    concluidas: consultasFiltradas.filter(c => c.status === CONSULTA_STATUS.CONCLUIDA).length,
    canceladas: consultasFiltradas.filter(c => c.status === CONSULTA_STATUS.CANCELADA).length,
    valorTotal: consultasFiltradas
      .filter(c => c.status === CONSULTA_STATUS.CONCLUIDA)
      .reduce((acc, c) => acc + (c.valorCobrado || c.tipoConsulta?.preco || 0), 0),
  };

  // Pagination
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
    totalItems: consultasOrdenadas.length,
    itemsPerPage: DEFAULT_PAGE_SIZE,
  });

  const consultasPaginadas = paginatedItems(consultasOrdenadas);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case CONSULTA_STATUS.CONCLUIDA:
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Concluída</Badge>;
      case CONSULTA_STATUS.CANCELADA:
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Cancelada</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">Desconhecido</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando histórico...</p>
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
                Histórico de Consultas
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Visualize todas as consultas finalizadas
              </p>
            </div>
            
            <Button variant="outline" onClick={exportarHistorico}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <History className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {stats.total}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Total no Histórico
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {stats.concluidas}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Concluídas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {stats.canceladas}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Canceladas
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <span className="text-purple-600 font-bold text-lg">R$</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {stats.valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Valor Total
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar por paciente ou tipo de consulta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600"
                  />
                </div>

                {/* Date Filter */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full md:w-auto">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {dataFiltro ? formatarData(dataFiltro.toISOString()) : "Filtrar por data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={dataFiltro}
                      onSelect={(date) => {
                        setDataFiltro(date);
                        setCalendarOpen(false);
                      }}
                      initialFocus
                    />
                    {dataFiltro && (
                      <div className="p-3 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDataFiltro(undefined);
                            setCalendarOpen(false);
                          }}
                          className="w-full"
                        >
                          Limpar filtro
                        </Button>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>

                {/* Status Filter */}
                <select
                  value={statusFiltro}
                  onChange={(e) => setStatusFiltro(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="todas">Todas</option>
                  <option value="concluidas">Concluídas</option>
                  <option value="canceladas">Canceladas</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Histórico List */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">
                Histórico de Consultas
                {consultasOrdenadas.length !== consultas.length && (
                  <span className="text-sm font-normal text-slate-600 dark:text-slate-400 ml-2">
                    ({consultasOrdenadas.length} de {consultas.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {consultasPaginadas.length > 0 ? (
                <div className="space-y-4">
                  {consultasPaginadas.map((consulta) => (
                    <ConsultaAgendadaCard
                      key={consulta.id}
                      consulta={consulta}
                      atualizarConsultas={fetchConsultas}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400">
                    {isLoading ? 'Carregando...' : 'Nenhuma consulta encontrada.'}
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Mostrando {((currentPage - 1) * DEFAULT_PAGE_SIZE) + 1} a {Math.min(currentPage * DEFAULT_PAGE_SIZE, consultasOrdenadas.length)} de {consultasOrdenadas.length} consultas
                  </p>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPreviousPage}
                      disabled={!canGoPrevious}
                      className="flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Anterior
                    </Button>

                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {currentPage} de {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPage}
                      disabled={!canGoNext}
                      className="flex items-center gap-1"
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

export default Historico;