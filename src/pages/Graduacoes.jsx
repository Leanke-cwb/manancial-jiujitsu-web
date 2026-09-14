import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Plus,
  Search,
  CalendarDays,
  Users,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

function formatarData(data) {
  if (!data) return "-";

  return new Date(
    `${data}T12:00:00`
  ).toLocaleDateString("pt-BR");
}

export default function Graduacoes() {
  const navigate = useNavigate();

  const [alunos, setAlunos] = useState([]);
  const [historico, setHistorico] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    try {
      setLoading(true);

      const [
        { data: alunosData, error: erroAlunos },
        { data: historicoData, error: erroHistorico },
      ] = await Promise.all([
        supabase
          .from("alunos")
          .select(`
            id,
            nome,
            faixa,
            grau,
            status
          `)
          .eq("status", "ativo")
          .order("nome", { ascending: true }),

        supabase
          .from("graduacoes")
          .select(`
            id,
            aluno_id,
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
          .order("data_graduacao", {
            ascending: false,
          })
          .order("created_at", {
            ascending: false,
          })
          .limit(100),
      ]);

      if (erroAlunos) throw erroAlunos;
      if (erroHistorico) throw erroHistorico;

      setAlunos(alunosData || []);
      setHistorico(historicoData || []);
    } catch (error) {
      console.error(
        "Erro ao carregar graduações:",
        error
      );

      alert(
        "Não foi possível carregar as graduações."
      );
    } finally {
      setLoading(false);
    }
  };

  const ultimaPorAluno = useMemo(() => {
    const mapa = new Map();

    for (const graduacao of historico) {
      if (!mapa.has(graduacao.aluno_id)) {
        mapa.set(
          graduacao.aluno_id,
          graduacao
        );
      }
    }

    return mapa;
  }, [historico]);

  const alunosFiltrados = useMemo(() => {
    const texto =
      pesquisa.trim().toLowerCase();

    if (!texto) return alunos;

    return alunos.filter(
      (aluno) =>
        aluno.nome
          ?.toLowerCase()
          .includes(texto) ||
        aluno.faixa
          ?.toLowerCase()
          .includes(texto)
    );
  }, [alunos, pesquisa]);

  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const graduacoesMes = historico.filter(
    (item) => {
      if (!item.data_graduacao) return false;

      const data = new Date(
        `${item.data_graduacao}T12:00:00`
      );

      return (
        data.getMonth() === mesAtual &&
        data.getFullYear() === anoAtual
      );
    }
  ).length;

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Graduações</h1>

          <p>
            Evolução de faixas e graus dos
            alunos.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() =>
            navigate("/graduacoes/nova")
          }
        >
          <Plus size={18} />
          Nova graduação
        </button>
      </header>

      <div className="graduation-summary-grid">
        <div className="graduation-summary-card">
          <Users size={21} />

          <span>Alunos ativos</span>

          <strong>{alunos.length}</strong>
        </div>

        <div className="graduation-summary-card">
          <Award size={21} />

          <span>Graduações registradas</span>

          <strong>{historico.length}</strong>
        </div>

        <div className="graduation-summary-card">
          <CalendarDays size={21} />

          <span>Graduações neste mês</span>

          <strong>{graduacoesMes}</strong>
        </div>
      </div>

      <section className="content-card">
        <div className="graduation-section-header">
          <div>
            <h2>Alunos</h2>

            <p>
              Selecione um aluno para registrar
              uma nova graduação.
            </p>
          </div>
        </div>

        <div className="filters-row">
          <div className="search-box">
            <Search size={18} />

            <input
              placeholder="Pesquisar aluno..."
              value={pesquisa}
              onChange={(e) =>
                setPesquisa(e.target.value)
              }
            />
          </div>
        </div>

        {loading ? (
          <div className="table-message">
            Carregando...
          </div>
        ) : alunosFiltrados.length === 0 ? (
          <div className="empty-state">
            Nenhum aluno encontrado.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Graduação atual</th>
                  <th>Última graduação</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {alunosFiltrados.map(
                  (aluno) => {
                    const ultima =
                      ultimaPorAluno.get(
                        aluno.id
                      );

                    return (
                      <tr key={aluno.id}>
                        <td>
                          <button
                            className="student-name-link"
                            onClick={() =>
                              navigate(
                                `/alunos/${aluno.id}`
                              )
                            }
                          >
                            {aluno.nome}
                          </button>
                        </td>

                        <td>
                          <strong>
                            {aluno.faixa ||
                              "Branca"}
                          </strong>
                          {" • "}
                          {aluno.grau ?? 0}º grau
                        </td>

                        <td>
                          {ultima
                            ? formatarData(
                                ultima.data_graduacao
                              )
                            : "Sem histórico"}
                        </td>

                        <td>
                          <button
                            className="btn-table-primary"
                            onClick={() =>
                              navigate(
                                `/graduacoes/nova?aluno=${aluno.id}`
                              )
                            }
                          >
                            <Award size={16} />
                            Graduar
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="content-card graduation-history-card">
        <div className="graduation-section-header">
          <div>
            <h2>Histórico recente</h2>

            <p>
              Últimas graduações registradas.
            </p>
          </div>
        </div>

        {historico.length === 0 ? (
          <div className="empty-state">
            Nenhuma graduação registrada.
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
                </tr>
              </thead>

              <tbody>
                {historico.map(
                  (graduacao) => (
                    <tr key={graduacao.id}>
                      <td>
                        {formatarData(
                          graduacao.data_graduacao
                        )}
                      </td>

                      <td>
                        {graduacao.alunos?.nome ||
                          "-"}
                      </td>

                      <td>
                        {graduacao.faixa_anterior ||
                          "-"}
                        {" • "}
                        {graduacao.grau_anterior ??
                          0}
                        º
                      </td>

                      <td>
                        <strong>
                          {graduacao.nova_faixa}
                        </strong>
                        {" • "}
                        {graduacao.novo_grau ?? 0}
                        º
                      </td>

                      <td>
                        {graduacao.professores
                          ?.nome || "-"}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
