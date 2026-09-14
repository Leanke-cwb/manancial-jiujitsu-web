import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Search,
  CheckCircle2,
  Users,
  GraduationCap,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";
import {
  baixarCSV,
  formatarData,
  hojeISO,
  inicioMesISO,
} from "./relatorioUtils";

export default function RelatorioFrequencia() {
  const navigate = useNavigate();

  const [inicio, setInicio] = useState(inicioMesISO());
  const [fim, setFim] = useState(hojeISO());
  const [turmaId, setTurmaId] = useState("");
  const [turmas, setTurmas] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [presencas, setPresencas] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarTurmas();
    carregar();
  }, []);

  const carregarTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from("turmas")
        .select("id, nome")
        .order("nome", { ascending: true });

      if (error) throw error;

      setTurmas(data || []);
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
    }
  };

  const carregar = async () => {
    if (!inicio || !fim) {
      alert("Informe o período.");
      return;
    }

    try {
      setLoading(true);

      let consulta = supabase
        .from("presencas")
        .select(`
          id,
          data,
          horario,
          tipo_registro,
          aluno_id,
          turma_id,
          alunos (
            id,
            nome,
            faixa,
            grau
          ),
          turmas (
            id,
            nome
          )
        `)
        .gte("data", inicio)
        .lte("data", fim)
        .order("data", { ascending: false })
        .order("horario", { ascending: false });

      if (turmaId) {
        consulta = consulta.eq("turma_id", turmaId);
      }

      const { data, error } = await consulta;

      if (error) throw error;

      setPresencas(data || []);
    } catch (error) {
      console.error("Erro ao carregar frequência:", error);
      alert(
        `Erro ao carregar relatório: ${
          error.message || "erro desconhecido"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const filtradas = useMemo(() => {
    const texto = pesquisa.trim().toLowerCase();

    if (!texto) return presencas;

    return presencas.filter(
      (item) =>
        item.alunos?.nome?.toLowerCase().includes(texto) ||
        item.turmas?.nome?.toLowerCase().includes(texto)
    );
  }, [presencas, pesquisa]);

  const alunosUnicos = new Set(
    filtradas.map((item) => item.aluno_id)
  ).size;

  const turmasUnicas = new Set(
    filtradas.map((item) => item.turma_id)
  ).size;

  const exportar = () => {
    baixarCSV(
      `relatorio_frequencia_${inicio}_${fim}.csv`,
      [
        "Data",
        "Horário",
        "Aluno",
        "Faixa",
        "Grau",
        "Turma",
        "Tipo de registro",
      ],
      filtradas.map((item) => [
        formatarData(item.data),
        item.horario?.slice(0, 5) || "",
        item.alunos?.nome || "",
        item.alunos?.faixa || "",
        item.alunos?.grau ?? 0,
        item.turmas?.nome || "",
        item.tipo_registro || "",
      ])
    );
  };

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <button
            className="back-button"
            onClick={() => navigate("/relatorios")}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>Relatório de Frequência</h1>
          <p>
            Presenças registradas por período e turma.
          </p>
        </div>

        <button
          className="btn-secondary"
          disabled={filtradas.length === 0}
          onClick={exportar}
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </header>

      <section className="content-card report-filter-card">
        <div className="report-filter-grid report-filter-grid-4">
          <div className="form-field">
            <label>Data inicial</label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Data final</label>
            <input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Turma</label>
            <select
              value={turmaId}
              onChange={(e) => setTurmaId(e.target.value)}
            >
              <option value="">Todas as turmas</option>
              {turmas.map((turma) => (
                <option key={turma.id} value={turma.id}>
                  {turma.nome}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn-primary report-filter-button"
            onClick={carregar}
            disabled={loading}
          >
            {loading ? "Carregando..." : "Aplicar filtro"}
          </button>
        </div>
      </section>

      <div className="report-summary-grid report-summary-grid-3">
        <div className="report-summary-card">
          <CheckCircle2 size={20} />
          <span>Presenças registradas</span>
          <strong>{filtradas.length}</strong>
        </div>

        <div className="report-summary-card">
          <Users size={20} />
          <span>Alunos com presença</span>
          <strong>{alunosUnicos}</strong>
        </div>

        <div className="report-summary-card">
          <GraduationCap size={20} />
          <span>Turmas com registros</span>
          <strong>{turmasUnicas}</strong>
        </div>
      </div>

      <section className="content-card">
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Pesquisar aluno ou turma..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>
        </div>

        {filtradas.length === 0 ? (
          <div className="empty-state">
            Nenhuma presença encontrada.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Aluno</th>
                  <th>Graduação</th>
                  <th>Turma</th>
                  <th>Registro</th>
                </tr>
              </thead>

              <tbody>
                {filtradas.map((item) => (
                  <tr key={item.id}>
                    <td>{formatarData(item.data)}</td>
                    <td>{item.horario?.slice(0, 5) || "-"}</td>
                    <td>{item.alunos?.nome || "-"}</td>
                    <td>
                      {item.alunos?.faixa || "-"} •{" "}
                      {item.alunos?.grau ?? 0}º
                    </td>
                    <td>{item.turmas?.nome || "-"}</td>
                    <td>{item.tipo_registro || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
