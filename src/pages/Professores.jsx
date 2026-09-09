import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Power,
  PowerOff,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

export default function Professores() {
  const navigate = useNavigate();

  const [professores, setProfessores] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [filtro, setFiltro] = useState("ativos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarProfessores();
  }, []);

  const carregarProfessores = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("professores")
        .select("*")
        .order("ativo", { ascending: false })
        .order("nome", { ascending: true });

      if (error) throw error;

      setProfessores(data || []);
    } catch (error) {
      console.error("Erro ao carregar professores:", error);
      alert("Não foi possível carregar os professores.");
    } finally {
      setLoading(false);
    }
  };

  const alterarStatus = async (professor) => {
    const novoStatus = !professor.ativo;

    const texto = novoStatus
      ? `Deseja reativar ${professor.nome}?`
      : `Deseja inativar ${professor.nome}?`;

    if (!window.confirm(texto)) return;

    try {
      const { error } = await supabase
        .from("professores")
        .update({ ativo: novoStatus })
        .eq("id", professor.id);

      if (error) throw error;

      setProfessores((lista) =>
        lista.map((item) =>
          item.id === professor.id
            ? { ...item, ativo: novoStatus }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert("Não foi possível alterar o status do professor.");
    }
  };

  const lista = useMemo(() => {
    const texto = pesquisa.trim().toLowerCase();

    return professores.filter((professor) => {
      const filtroOk =
        filtro === "todos" ||
        (filtro === "ativos" && professor.ativo) ||
        (filtro === "inativos" && !professor.ativo);

      const pesquisaOk =
        !texto ||
        professor.nome?.toLowerCase().includes(texto) ||
        professor.cpf?.toLowerCase().includes(texto) ||
        professor.telefone?.toLowerCase().includes(texto) ||
        professor.email?.toLowerCase().includes(texto);

      return filtroOk && pesquisaOk;
    });
  }, [professores, pesquisa, filtro]);

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Professores</h1>
          <p>Cadastro e gestão dos professores e instrutores.</p>
        </div>

        <button
          className="btn-primary"
          onClick={() => navigate("/professores/novo")}
        >
          <Plus size={18} />
          Novo professor
        </button>
      </header>

      <section className="content-card">
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Pesquisar professor..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
            <option value="todos">Todos</option>
          </select>
        </div>

        {loading ? (
          <div className="table-message">Carregando professores...</div>
        ) : lista.length === 0 ? (
          <div className="empty-state">
            Nenhum professor encontrado.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Professor</th>
                  <th>Função</th>
                  <th>Graduação</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {lista.map((professor) => (
                  <tr key={professor.id}>
                    <td>
                      <div className="teacher-name">
                        <strong>{professor.nome}</strong>
                        <span>{professor.email || "Sem e-mail"}</span>
                      </div>
                    </td>

                    <td>{professor.funcao || "-"}</td>

                    <td>
                      {professor.faixa || "-"}
                      {professor.grau !== null &&
                      professor.grau !== undefined
                        ? ` • ${professor.grau}º grau`
                        : ""}
                    </td>

                    <td>{professor.telefone || "-"}</td>

                    <td>
                      <span
                        className={`status-badge ${
                          professor.ativo
                            ? "status-ativo"
                            : "status-inativo"
                        }`}
                      >
                        {professor.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          title="Editar professor"
                          onClick={() =>
                            navigate(
                              `/professores/${professor.id}/editar`
                            )
                          }
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          className="icon-button"
                          title={
                            professor.ativo
                              ? "Inativar professor"
                              : "Reativar professor"
                          }
                          onClick={() => alterarStatus(professor)}
                        >
                          {professor.ativo ? (
                            <PowerOff size={17} />
                          ) : (
                            <Power size={17} />
                          )}
                        </button>
                      </div>
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
