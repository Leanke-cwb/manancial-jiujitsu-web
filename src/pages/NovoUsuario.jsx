import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
} from "lucide-react";

import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from "@supabase/supabase-js";

import { supabase } from "../services/supabaseClient";

export default function NovoUsuario() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    perfil: "recepcao",
  });

  const [salvando, setSalvando] = useState(false);

  const alterar = (campo, valor) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const enviarConvite = async (e) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome.");
      return;
    }

    if (!form.email.trim()) {
      alert("Informe o e-mail.");
      return;
    }

    try {
      setSalvando(true);

      const {
        data,
        error,
      } = await supabase.functions.invoke(
        "criar-usuario",
        {
          body: {
            nome: form.nome.trim(),
            email: form.email
              .trim()
              .toLowerCase(),
            telefone:
              form.telefone.trim() ||
              null,
            perfil: form.perfil,
            redirectTo: `${window.location.origin}/ativar-conta`,
          },
        }
      );

      if (error) {
        if (error instanceof FunctionsHttpError) {
          let detalhe = null;

          try {
            detalhe = await error.context.json();
          } catch {
            // Mantém a mensagem padrão caso a resposta não seja JSON.
          }

          throw new Error(
            detalhe?.error ||
              detalhe?.message ||
              error.message
          );
        }

        if (error instanceof FunctionsRelayError) {
          throw new Error(
            `Erro de comunicação com a Edge Function: ${error.message}`
          );
        }

        if (error instanceof FunctionsFetchError) {
          throw new Error(
            `Não foi possível acessar a Edge Function: ${error.message}`
          );
        }

        throw error;
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      alert(
        "Usuário criado e convite enviado por e-mail."
      );

      navigate(
        "/configuracoes/usuarios"
      );
    } catch (error) {
      console.error(
        "Erro ao criar usuário:",
        error
      );

      alert(
        `Erro ao criar usuário: ${
          error.message ||
          "erro desconhecido"
        }`
      );
    } finally {
      setSalvando(false);
    }
  };

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

          <h1>Novo usuário</h1>

          <p>
            O usuário receberá um convite por
            e-mail para definir a senha.
          </p>
        </div>
      </header>

      <form
        className="student-form"
        onSubmit={enviarConvite}
      >
        <section className="form-card">
          <div className="form-section-title">
            <h2>Dados do usuário</h2>
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
              <label>E-mail *</label>

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  alterar(
                    "email",
                    e.target.value
                  )
                }
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
              <label>Perfil de acesso *</label>

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
          </div>

          <div className="permission-help">
            <strong>
              Perfis sugeridos
            </strong>

            <p>
              Administrador: acesso total.
              Professor: alunos, turmas,
              presenças, graduações e
              relatórios acadêmicos. Instrutor:
              alunos e presenças. Recepção:
              alunos e financeiro. Aluno:
              reservado para o portal do aluno.
            </p>
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
            <Send size={18} />

            {salvando
              ? "Enviando..."
              : "Criar e enviar convite"}
          </button>
        </div>
      </form>
    </div>
  );
}
