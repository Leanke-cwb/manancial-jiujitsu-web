import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Search,
  Users,
  GraduationCap,
  UserRoundCheck,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";
import {
  baixarCSV,
} from "./relatorioUtils";

export default function RelatorioTurmas() {
  const navigate = useNavigate();

  const [turmaId, setTurmaId] = useState("");
  const [turmas, setTurmas] = useState([]);
  const [vinculos, setVinculos] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarTurmas();
    carregar();
  }, []);

  const carregarTurmas = async () => {
    try {
      const { data, error } = await supabase
        .from("turmas")
        .select(`
          id,
          nome,
          categoria,
          capacidade,
          professores (
            nome
          )
        `)
        .order("nome", { ascending: true });

      if (error) throw error;

      setTurmas(data || []);
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
    }
  };

  const carregar = async () => {
    try {
      setLoading(true);

      let consulta = supabase
        .from("turma_alunos")
        .select(`
          id,
          turma_id,
          aluno_id,
          ativo,
          alunos (
            id,
            nome,
            faixa,
            grau,
            telefone,
            email,
            status
          ),
          turmas (
            id,
            nome,
            categoria,
            capacidade,
            professores (
              nome
            )
          )
        `)
        .eq("ativo", true);

      if (turmaId) {
        consulta = consulta.eq("turma_id", turmaId);
      }

      const { data, error } = await consulta;

      if (error) throw error;

      const ordenados = (data || []).sort((a, b) => {
        const turmaA = a.turmas?.nome || "";
        const turmaB = b.turmas?.nome || "";

        if (turmaA !== turmaB) {
          return turmaA.localeCompare(turmaB);
        }

        return (a.alunos?.nome || "").localeCompare(
          b.alunos?.nome || ""
        );
      });

      setVinculos(ordenados);
    } catch (error) {
      console.error("Erro ao carregar alunos por turma:", error);
      alert(
        `Erro ao carregar relatório: ${
          error.message || "erro desconhecido"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const filtrados = useMemo(() => {
    const texto = pesquisa.trim().toLowerCase();

    if (!texto) return vinculos;

    return vinculos.filter(
      (item) =>
        item.alunos?.nome?.toLowerCase().includes(texto) ||
        item.turmas?.nome?.toLowerCase().includes(texto) ||
        item.alunos?.faixa?.toLowerCase().includes(texto)
    );
  }, [vinculos, pesquisa]);

  const alunosUnicos = new Set(
    filtrados.map((item) => item.aluno_id)
  ).size;

  const turmasUnicas = new Set(
    filtrados.map((item) => item.turma_id)
  ).size;

  const professoresUnicos = new Set(
    filtrados
      .map((item) => item.turmas?.professores?.nome)
      .filter(Boolean)
  ).size;

  const exportar = () => {
    baixarCSV(
      "relatorio_alunos_por_turma.csv",
      [
        "Turma",
        "Categoria",
        "Professor",
        "Aluno",
        "Faixa",
        "Grau",
        "Telefone",
        "E-mail",
        "Status do aluno",
      ],
      filtrados.map((item) => [
        item.turmas?.nome || "",
        item.turmas?.categoria || "",
        item.turmas?.professores?.nome || "",
        item.alunos?.nome || "",
        item.alunos?.faixa || "",
        item.alunos?.grau ?? 0,
        item.alunos?.telefone || "",
        item.alunos?.email || "",
        item.alunos?.status || "",
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

          <h1>Alunos por Turma</h1>
          <p>
            Relação atual de alunos vinculados às turmas.
          </p>
        </div>

        <button
          className="btn-secondary"
          disabled={filtrados.length === 0}
          onClick={exportar}
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </header>

      <section className="content-card report-filter-card">
        <div className="report-filter-grid report-filter-grid-2">
          <div className="form-field">
            <label>Turma</label>

            <select
              value={turmaId}
              onChange={(e) =>
                setTurmaId(e.target.value)
              }
            >
              <option value="">
                Todas as turmas
              </option>

              {turmas.map((turma) => (
                <option
                  key={turma.id}
                  value={turma.id}
                >
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
            {loading
              ? "Carregando..."
              : "Aplicar filtro"}
          </button>
        </div>
      </section>

      <div className="report-summary-grid report-summary-grid-3">
        <div className="report-summary-card">
          <Users size={20} />
          <span>Alunos vinculados</span>
          <strong>{alunosUnicos}</strong>
        </div>

        <div className="report-summary-card">
          <GraduationCap size={20} />
          <span>Turmas</span>
          <strong>{turmasUnicas}</strong>
        </div>

        <div className="report-summary-card">
          <UserRoundCheck size={20} />
          <span>Professores</span>
          <strong>{professoresUnicos}</strong>
        </div>
      </div>

      <section className="content-card">
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Pesquisar aluno, turma ou faixa..."
              value={pesquisa}
              onChange={(e) =>
                setPesquisa(e.target.value)
              }
            />
          </div>
        </div>

        {filtrados.length === 0 ? (
          <div className="empty-state">
            Nenhum aluno vinculado encontrado.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Turma</th>
                  <th>Professor</th>
                  <th>Aluno</th>
                  <th>Graduação</th>
                  <th>Telefone</th>
                </tr>
              </thead>

              <tbody>
                {filtrados.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>
                        {item.turmas?.nome || "-"}
                      </strong>
                    </td>

                    <td>
                      {item.turmas?.professores?.nome || "-"}
                    </td>

                    <td>
                      {item.alunos?.nome || "-"}
                    </td>

                    <td>
                      {item.alunos?.faixa || "-"} •{" "}
                      {item.alunos?.grau ?? 0}º
                    </td>

                    <td>
                      {item.alunos?.telefone || "-"}
                    </td>
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
