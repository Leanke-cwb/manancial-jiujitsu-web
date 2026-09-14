import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Save,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

export default function EditarUsuario() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    perfil: "recepcao",
    ativo: true,
  });

  const [loading, setLoading] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  useEffect(() => {
    carregar();
  }, [id]);

  const carregar = async () => {
    try {
      setLoading(true);

      const {
        data,
        error,
      } = await supabase
        .from("usuarios")
        .select(`
          id,
          nome,
          email,
          telefone,
          perfil,
          ativo
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      setForm({
        nome: data.nome || "",
        email: data.email || "",
        telefone:
          data.telefone || "",
        perfil:
          data.perfil || "recepcao",
        ativo:
          data.ativo !== false,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar usuário:",
        error
      );

      alert(
        "Não foi possível carregar o usuário."
      );

      navigate(
        "/configuracoes/usuarios"
      );
    } finally {
      setLoading(false);
    }
  };

  const alterar = (campo, valor) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const salvar = async (e) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome.");
      return;
    }

    try {
      setSalvando(true);

      const {
        error,
      } = await supabase
        .from("usuarios")
        .update({
          nome:
            form.nome.trim(),
          telefone:
            form.telefone.trim() ||
            null,
          perfil:
            form.perfil,
          ativo:
            form.ativo,
        })
        .eq("id", id);

      if (error) throw error;

      alert(
        "Usuário atualizado com sucesso!"
      );

      navigate(
        "/configuracoes/usuarios"
      );
    } catch (error) {
      console.error(
        "Erro ao atualizar usuário:",
        error
      );

      alert(
        `Erro ao atualizar usuário: ${
          error.message ||
          "erro desconhecido"
        }`
      );
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        Carregando usuário...
      </div>
    );
  }

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <button
            className="back-button"
            onClick={() =>
              navigate(
                "/configuracoes/usuarios"
              )
            }
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>Editar usuário</h1>

          <p>{form.email}</p>
        </div>
      </header>

      <form
        className="student-form"
        onSubmit={salvar}
      >
        <section className="form-card">
          <div className="form-section-title">
            <h2>
              Dados e permissões
            </h2>
          </div>

          <div className="form-grid">
            <div className="form-field span-2">
              <label>Nome *</label>

              <input
                value={form.nome}
                onChange={(e) =>
                  alterar(
                    "nome",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field span-2">
              <label>E-mail</label>

              <input
                value={form.email}
                disabled
              />
            </div>

            <div className="form-field">
              <label>Telefone</label>

              <input
                value={form.telefone}
                onChange={(e) =>
                  alterar(
                    "telefone",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>Perfil</label>

              <select
                value={form.perfil}
                onChange={(e) =>
                  alterar(
                    "perfil",
                    e.target.value
                  )
                }
              >
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

            <div className="form-field">
              <label>Status</label>

              <select
                value={
                  form.ativo
                    ? "ativo"
                    : "inativo"
                }
                onChange={(e) =>
                  alterar(
                    "ativo",
                    e.target.value ===
                      "ativo"
                  )
                }
              >
                <option value="ativo">
                  Ativo
                </option>

                <option value="inativo">
                  Inativo
                </option>
              </select>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              navigate(
                "/configuracoes/usuarios"
              )
            }
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={salvando}
          >
            <Save size={18} />

            {salvando
              ? "Salvando..."
              : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
