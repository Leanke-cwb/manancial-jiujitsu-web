import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  Plus,
  Search,
  Pencil,
  UserX,
  UserCheck,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

export default function Alunos() {
  const navigate = useNavigate();

  const [alunos, setAlunos] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] =
    useState("todos");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarAlunos();
  }, []);

  const carregarAlunos = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("alunos")
        .select(`
          id,
          nome,
          cpf,
          telefone,
          email,
          faixa,
          grau,
          status,
          data_matricula
        `)
        .order("nome", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setAlunos(data || []);
    } catch (error) {
      console.error(
        "Erro ao carregar alunos:",
        error
      );

      alert("Erro ao carregar os alunos.");
    } finally {
      setLoading(false);
    }
  };

  const alterarStatus = async (aluno) => {
    const novoStatus =
      aluno.status === "ativo"
        ? "inativo"
        : "ativo";

    const mensagem =
      novoStatus === "inativo"
        ? `Deseja inativar ${aluno.nome}?`
        : `Deseja reativar ${aluno.nome}?`;

    if (!window.confirm(mensagem)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("alunos")
        .update({
          status: novoStatus,
        })
        .eq("id", aluno.id);

      if (error) {
        throw error;
      }

      setAlunos((lista) =>
        lista.map((item) =>
          item.id === aluno.id
            ? {
                ...item,
                status: novoStatus,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Erro ao alterar status:",
        error
      );

      alert(
        "Não foi possível alterar o status."
      );
    }
  };

  const alunosFiltrados = useMemo(() => {
    const texto = pesquisa
      .trim()
      .toLowerCase();

    return alunos.filter((aluno) => {
      const statusValido =
        filtroStatus === "todos" ||
        aluno.status === filtroStatus;

      const pesquisaValida =
        !texto ||
        aluno.nome
          ?.toLowerCase()
          .includes(texto) ||
        aluno.cpf
          ?.toLowerCase()
          .includes(texto) ||
        aluno.telefone
          ?.toLowerCase()
          .includes(texto);

      return statusValido && pesquisaValida;
    });
  }, [alunos, pesquisa, filtroStatus]);

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Alunos</h1>

          <p>
            Cadastro e gerenciamento dos alunos
            da academia.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() =>
            navigate("/alunos/novo")
          }
        >
          <Plus size={18} />
          Novo aluno
        </button>
      </header>

      <section className="content-card">
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} />

            <input
              type="text"
              placeholder="Pesquisar por nome, CPF ou telefone..."
              value={pesquisa}
              onChange={(e) =>
                setPesquisa(e.target.value)
              }
            />
          </div>

          <select
            className="filter-select"
            value={filtroStatus}
            onChange={(e) =>
              setFiltroStatus(e.target.value)
            }
          >
            <option value="todos">
              Todos
            </option>

            <option value="ativo">
              Ativos
            </option>

            <option value="inativo">
              Inativos
            </option>

            <option value="trancado">
              Trancados
            </option>

            <option value="visitante">
              Visitantes
            </option>
          </select>
        </div>

        {loading ? (
          <div className="table-message">
            Carregando alunos...
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
                  <th>Telefone</th>
                  <th>Faixa</th>
                  <th>Grau</th>
                  <th>Situação</th>
                  <th>Matrícula</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {alunosFiltrados.map(
                  (aluno) => (
                    <tr key={aluno.id}>
                      <td>
                        <div className="student-name">
                          <strong>
                            {aluno.nome}
                          </strong>

                          <span>
                            {aluno.cpf ||
                              "CPF não informado"}
                          </span>
                        </div>
                      </td>

                      <td>
                        {aluno.telefone || "-"}
                      </td>

                      <td>{aluno.faixa}</td>

                      <td>{aluno.grau}</td>

                      <td>
                        <span
                          className={`status-badge status-${aluno.status}`}
                        >
                          {aluno.status}
                        </span>
                      </td>

                      <td>
                        {aluno.data_matricula
                          ? new Date(
                              `${aluno.data_matricula}T12:00:00`
                            ).toLocaleDateString(
                              "pt-BR"
                            )
                          : "-"}
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-button"
                            title="Editar"
                            onClick={() =>
                              navigate(
                                `/alunos/${aluno.id}/editar`
                              )
                            }
                          >
                            <Pencil
                              size={17}
                            />
                          </button>

                          <button
                            className="icon-button"
                            title={
                              aluno.status ===
                              "ativo"
                                ? "Inativar"
                                : "Ativar"
                            }
                            onClick={() =>
                              alterarStatus(
                                aluno
                              )
                            }
                          >
                            {aluno.status ===
                            "ativo" ? (
                              <UserX
                                size={17}
                              />
                            ) : (
                              <UserCheck
                                size={17}
                              />
                            )}
                          </button>
                        </div>
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