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
  Power,
  PowerOff,
  ArrowLeft,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

const NOMES_PERFIS = {
  admin: "Administrador",
  professor: "Professor",
  instrutor: "Instrutor",
  recepcao: "Recepção",
  aluno: "Aluno",
};

export default function Usuarios() {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [perfil, setPerfil] = useState("todos");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("usuarios")
        .select(`
          id,
          user_id,
          nome,
          email,
          telefone,
          perfil,
          ativo,
          created_at
        `)
        .order("nome", { ascending: true });

      if (error) throw error;

      setUsuarios(data || []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);

      alert(
        `Erro ao carregar usuários: ${
          error.message || "erro desconhecido"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const alterarStatus = async (usuario) => {
    if (usuario.perfil === "admin" && usuario.ativo) {
      const adminsAtivos = usuarios.filter(
        (item) =>
          item.perfil === "admin" &&
          item.ativo
      ).length;

      if (adminsAtivos <= 1) {
        alert(
          "Não é possível inativar o único administrador ativo."
        );
        return;
      }
    }

    const novoStatus = !usuario.ativo;

    if (
      !window.confirm(
        novoStatus
          ? `Reativar o acesso de ${usuario.nome}?`
          : `Inativar o acesso de ${usuario.nome}?`
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("usuarios")
        .update({
          ativo: novoStatus,
        })
        .eq("id", usuario.id);

      if (error) throw error;

      setUsuarios((lista) =>
        lista.map((item) =>
          item.id === usuario.id
            ? {
                ...item,
                ativo: novoStatus,
              }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert(
        `Erro ao alterar status: ${
          error.message || "erro desconhecido"
        }`
      );
    }
  };

  const filtrados = useMemo(() => {
    const texto = pesquisa.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const perfilOk =
        perfil === "todos" ||
        usuario.perfil === perfil;

      const pesquisaOk =
        !texto ||
        usuario.nome?.toLowerCase().includes(texto) ||
        usuario.email?.toLowerCase().includes(texto) ||
        usuario.telefone?.toLowerCase().includes(texto);

      return perfilOk && pesquisaOk;
    });
  }, [usuarios, pesquisa, perfil]);

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <button
            className="back-button"
            onClick={() =>
              navigate("/configuracoes")
            }
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>Usuários</h1>

          <p>
            Controle de acesso ao sistema.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() =>
            navigate("/configuracoes/usuarios/novo")
          }
        >
          <Plus size={18} />
          Novo usuário
        </button>
      </header>

      <section className="content-card">
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} />

            <input
              placeholder="Pesquisar usuário..."
              value={pesquisa}
              onChange={(e) =>
                setPesquisa(e.target.value)
              }
            />
          </div>

          <select
            className="filter-select"
            value={perfil}
            onChange={(e) =>
              setPerfil(e.target.value)
            }
          >
            <option value="todos">
              Todos os perfis
            </option>
            <option value="admin">
              Administrador
            </option>
            <option value="professor">
              Professor
            </option>
            <option value="instrutor">
              Instrutor
            </option>
            <option value="recepcao">
              Recepção
            </option>
            <option value="aluno">
              Aluno
            </option>
          </select>
        </div>

        {loading ? (
          <div className="table-message">
            Carregando usuários...
          </div>
        ) : filtrados.length === 0 ? (
          <div className="empty-state">
            Nenhum usuário encontrado.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Telefone</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filtrados.map((usuario) => (
                  <tr key={usuario.id}>
                    <td>
                      <div className="user-table-name">
                        <strong>
                          {usuario.nome}
                        </strong>

                        <span>
                          {usuario.email}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className="role-badge">
                        {NOMES_PERFIS[
                          usuario.perfil
                        ] || usuario.perfil}
                      </span>
                    </td>

                    <td>
                      {usuario.telefone || "-"}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          usuario.ativo
                            ? "status-ativo"
                            : "status-inativo"
                        }`}
                      >
                        {usuario.ativo
                          ? "Ativo"
                          : "Inativo"}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          title="Editar usuário"
                          onClick={() =>
                            navigate(
                              `/configuracoes/usuarios/${usuario.id}/editar`
                            )
                          }
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          className="icon-button"
                          title={
                            usuario.ativo
                              ? "Inativar"
                              : "Reativar"
                          }
                          onClick={() =>
                            alterarStatus(usuario)
                          }
                        >
                          {usuario.ativo ? (
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
