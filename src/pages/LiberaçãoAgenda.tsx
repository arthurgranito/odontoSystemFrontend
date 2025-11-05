import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import Sidebar from "../components/common/Sidebar";
import GerarAgenda from "../components/common/GerarAgenda";
import ExcluirAgenda from "../components/common/ExcluirAgenda";
import { useAuth } from "../hooks/useAuth";
import api from "../services/api";
import { 
  Calendar, 
  Settings, 
  Plus, 
  Trash2,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";

const LiberacaoAgenda: React.FC = () => {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [agendasDisponiveis, setAgendasDisponiveis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showGerar, setShowGerar] = useState<boolean>(false);
  const [showExcluir, setShowExcluir] = useState<boolean>(false);
  const { user } = useAuth();

  const fetchAgendas = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/agenda/disponiveis");
      setAgendasDisponiveis(response.data);
    } catch (error) {
      toast.error("Erro ao carregar as agendas disponíveis!");
      console.error('Erro ao buscar agendas:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgendas();
  }, [fetchAgendas]);

  const handleAgendaGerada = useCallback(() => {
    fetchAgendas();
    setShowGerar(false);
    toast.success("Agenda gerada com sucesso!");
  }, [fetchAgendas]);

  const handleAgendaExcluida = useCallback(() => {
    fetchAgendas();
    setShowExcluir(false);
    toast.success("Agenda excluída com sucesso!");
  }, [fetchAgendas]);

  // Estatísticas das agendas
  const stats = {
    total: agendasDisponiveis.length,
    hoje: agendasDisponiveis.filter(a => {
      const hoje = new Date().toISOString().slice(0, 10);
      return a.data === hoje;
    }).length,
    proximosDias: agendasDisponiveis.filter(a => {
      const hoje = new Date();
      const agendaData = new Date(a.data);
      const diffTime = agendaData.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    }).length,
    diasUnicos: [...new Set(agendasDisponiveis.map(a => a.data))].length
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Carregando agendas...</p>
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
                Liberação de Agenda
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Gerencie a disponibilidade de horários para agendamento
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                onClick={() => {
                  setShowGerar(!showGerar);
                  setShowExcluir(false);
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                {showGerar ? 'Cancelar' : 'Gerar Agenda'}
              </Button>
              
              <Button 
                onClick={() => {
                  setShowExcluir(!showExcluir);
                  setShowGerar(false);
                }}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {showExcluir ? 'Cancelar' : 'Excluir Agenda'}
              </Button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {stats.total}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Horários Disponíveis
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {stats.hoje}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Disponíveis Hoje
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {stats.proximosDias}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Próximos 7 Dias
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Settings className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {stats.diasUnicos}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Dias com Agenda
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gerar Agenda */}
            {showGerar && (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-green-600" />
                    Gerar Nova Agenda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GerarAgenda onAgendaGerada={handleAgendaGerada} user={user} />
                </CardContent>
              </Card>
            )}

            {/* Excluir Agenda */}
            {showExcluir && (
              <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Trash2 className="w-5 h-5 text-red-600" />
                    Excluir Agenda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ExcluirAgenda onAgendaExcluida={handleAgendaExcluida} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Informações e Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status da Agenda */}
            <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-cyan-600" />
                  Status da Agenda
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agendasDisponiveis.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-400">
                          Agenda Ativa
                        </span>
                      </div>
                      <span className="text-sm text-green-600 dark:text-green-400">
                        {stats.total} horários disponíveis
                      </span>
                    </div>
                    
                    <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                      <p>• {stats.hoje} horários disponíveis hoje</p>
                      <p>• {stats.proximosDias} horários nos próximos 7 dias</p>
                      <p>• Agenda configurada para {stats.diasUnicos} dias diferentes</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      Nenhuma agenda disponível
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Gere uma nova agenda para começar a receber agendamentos.
                    </p>
                    <Button 
                      onClick={() => setShowGerar(true)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Gerar Primeira Agenda
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Informações Importantes */}
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Informações Importantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>A agenda é gerada com base nas escalas de trabalho cadastradas</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Apenas horários livres ficam disponíveis para agendamento</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Ao excluir uma agenda, todos os horários daquele período são removidos</p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Recomenda-se gerar agenda com antecedência para facilitar agendamentos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LiberacaoAgenda;