import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Search,
  Award,
  Users,
  UserRoundCheck,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";
import {
  baixarCSV,
  formatarData,
  hojeISO,
  inicioMesISO,
} from "./relatorioUtils";

export default function RelatorioGraduacoes() {
  const navigate = useNavigate();

  const [inicio, setInicio] = useState(inicioMesISO());
  const [fim, setFim] = useState(hojeISO());
  const [professorId, setProfessorId] = useState("");
  const [professores, setProfessores] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [graduacoes, setGraduacoes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregarProfessores();
    carregar();
  }, []);

  const carregarProfessores = async () => {
    try {
      const { data, error } = await supabase
        .from("professores")
        .select("id, nome")
        .order("nome", { ascending: true });

      if (error) throw error;

      setProfessores(data || []);
    } catch (error) {
      console.error("Erro ao carregar professores:", error);
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
        .from("graduacoes")
        .select(`
          id,
          aluno_id,
          professor_id,
          faixa_anterior,
          grau_anterior,
          nova_faixa,
          novo_grau,
          data_graduacao,
          observacoes,
          alunos (
            id,
            nome
          ),
          professores (
            id,
            nome
          )
        `)
        .gte("data_graduacao", inicio)
        .lte("data_graduacao", fim)
        .order("data_graduacao", {
          ascending: false,
        });

      if (professorId) {
        consulta = consulta.eq(
          "professor_id",
          professorId
        );
      }

      const { data, error } = await consulta;

      if (error) throw error;

      setGraduacoes(data || []);
    } catch (error) {
      console.error("Erro ao carregar graduações:", error);
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

    if (!texto) return graduacoes;

    return graduacoes.filter(
      (item) =>
        item.alunos?.nome?.toLowerCase().includes(texto) ||
        item.professores?.nome?.toLowerCase().includes(texto) ||
        item.nova_faixa?.toLowerCase().includes(texto)
    );
  }, [graduacoes, pesquisa]);

  const alunosUnicos = new Set(
    filtradas.map((item) => item.aluno_id)
  ).size;

  const professoresUnicos = new Set(
    filtradas
      .map((item) => item.professor_id)
      .filter(Boolean)
  ).size;

  const exportar = () => {
    baixarCSV(
      `relatorio_graduacoes_${inicio}_${fim}.csv`,
      [
        "Data",
        "Aluno",
        "Faixa anterior",
        "Grau anterior",
        "Nova faixa",
        "Novo grau",
        "Professor",
        "Observações",
      ],
      filtradas.map((item) => [
        formatarData(item.data_graduacao),
        item.alunos?.nome || "",
        item.faixa_anterior || "",
        item.grau_anterior ?? 0,
        item.nova_faixa || "",
        item.novo_grau ?? 0,
        item.professores?.nome || "",
        item.observacoes || "",
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

          <h1>Relatório de Graduações</h1>

          <p>
            Histórico de mudanças de faixa e grau.
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
              onChange={(e) =>
                setInicio(e.target.value)
              }
            />
          </div>

          <div className="form-field">
            <label>Data final</label>

            <input
              type="date"
              value={fim}
              onChange={(e) =>
                setFim(e.target.value)
              }
            />
          </div>

          <div className="form-field">
            <label>Professor</label>

            <select
              value={professorId}
              onChange={(e) =>
                setProfessorId(
                  e.target.value
                )
              }
            >
              <option value="">
                Todos os professores
              </option>

              {professores.map(
                (professor) => (
                  <option
                    key={professor.id}
                    value={professor.id}
                  >
                    {professor.nome}
                  </option>
                )
              )}
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
          <Award size={20} />
          <span>Graduações</span>
          <strong>{filtradas.length}</strong>
        </div>

        <div className="report-summary-card">
          <Users size={20} />
          <span>Alunos graduados</span>
          <strong>{alunosUnicos}</strong>
        </div>

        <div className="report-summary-card">
          <UserRoundCheck size={20} />
          <span>Professores envolvidos</span>
          <strong>{professoresUnicos}</strong>
        </div>
      </div>

      <section className="content-card">
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} />

            <input
              placeholder="Pesquisar aluno, professor ou faixa..."
              value={pesquisa}
              onChange={(e) =>
                setPesquisa(e.target.value)
              }
            />
          </div>
        </div>

        {filtradas.length === 0 ? (
          <div className="empty-state">
            Nenhuma graduação encontrada.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Aluno</th>
                  <th>Anterior</th>
                  <th>Nova graduação</th>
                  <th>Professor</th>
                  <th>Observações</th>
                </tr>
              </thead>

              <tbody>
                {filtradas.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {formatarData(
                        item.data_graduacao
                      )}
                    </td>

                    <td>
                      {item.alunos?.nome ||
                        "-"}
                    </td>

                    <td>
                      {item.faixa_anterior ||
                        "-"}{" "}
                      •{" "}
                      {item.grau_anterior ??
                        0}
                      º
                    </td>

                    <td>
                      <strong>
                        {item.nova_faixa ||
                          "-"}
                      </strong>
                      {" • "}
                      {item.novo_grau ?? 0}º
                    </td>

                    <td>
                      {item.professores?.nome ||
                        "-"}
                    </td>

                    <td>
                      {item.observacoes ||
                        "-"}
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
