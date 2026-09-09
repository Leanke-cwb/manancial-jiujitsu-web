import React, { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import { supabase } from "../services/supabaseClient";

export default function EditarProfessor() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    email: "",
    faixa: "Preta",
    grau: 0,
    funcao: "Professor",
    ativo: true,
  });

  useEffect(() => {
    carregar();
  }, [id]);

  const alterar = (campo, valor) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const carregar = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("professores")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setForm({
        nome: data.nome || "",
        cpf: data.cpf || "",
        telefone: data.telefone || "",
        email: data.email || "",
        faixa: data.faixa || "Preta",
        grau: data.grau ?? 0,
        funcao: data.funcao || "Professor",
        ativo: data.ativo !== false,
      });
    } catch (error) {
      console.error("Erro ao carregar professor:", error);
      alert("Não foi possível carregar o professor.");
      navigate("/professores");
    } finally {
      setLoading(false);
    }
  };

  const salvar = async (e) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome do professor.");
      return;
    }

    try {
      setSalvando(true);

      const { error } = await supabase
        .from("professores")
        .update({
          nome: form.nome.trim(),
          cpf: form.cpf.trim() || null,
          telefone: form.telefone.trim() || null,
          email: form.email.trim() || null,
          faixa: form.faixa || null,
          grau:
            form.grau === "" || form.grau === null
              ? null
              : Number(form.grau),
          funcao: form.funcao.trim() || null,
          ativo: form.ativo,
        })
        .eq("id", id);

      if (error) throw error;

      alert("Professor atualizado com sucesso!");
      navigate("/professores");
    } catch (error) {
      console.error("Erro ao atualizar professor:", error);

      alert(
        `Erro ao atualizar professor: ${
          error.message || "erro desconhecido"
        }`
      );
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        Carregando professor...
      </div>
    );
  }

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <button
            className="back-button"
            onClick={() => navigate("/professores")}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>Editar professor</h1>
          <p>{form.nome}</p>
        </div>
      </header>

      <form className="student-form" onSubmit={salvar}>
        <section className="form-card">
          <div className="form-section-title">
            <h2>Dados pessoais</h2>
          </div>

          <div className="form-grid">
            <div className="form-field span-2">
              <label>Nome *</label>
              <input
                value={form.nome}
                onChange={(e) => alterar("nome", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>CPF</label>
              <input
                value={form.cpf}
                onChange={(e) => alterar("cpf", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Telefone</label>
              <input
                value={form.telefone}
                onChange={(e) => alterar("telefone", e.target.value)}
              />
            </div>

            <div className="form-field span-2">
              <label>E-mail</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => alterar("email", e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="form-section-title">
            <h2>Jiu-Jitsu</h2>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>Faixa</label>
              <select
                value={form.faixa}
                onChange={(e) => alterar("faixa", e.target.value)}
              >
                <option value="Branca">Branca</option>
                <option value="Azul">Azul</option>
                <option value="Roxa">Roxa</option>
                <option value="Marrom">Marrom</option>
                <option value="Preta">Preta</option>
                <option value="Coral">Coral</option>
                <option value="Vermelha">Vermelha</option>
              </select>
            </div>

            <div className="form-field">
              <label>Grau</label>
              <input
                type="number"
                min="0"
                max="10"
                value={form.grau}
                onChange={(e) => alterar("grau", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Função</label>
              <select
                value={form.funcao}
                onChange={(e) => alterar("funcao", e.target.value)}
              >
                <option value="Professor">Professor</option>
                <option value="Instrutor">Instrutor</option>
                <option value="Auxiliar">Auxiliar</option>
              </select>
            </div>

            <div className="form-field">
              <label>Status</label>
              <select
                value={form.ativo ? "ativo" : "inativo"}
                onChange={(e) =>
                  alterar("ativo", e.target.value === "ativo")
                }
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/professores")}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={salvando}
          >
            <Save size={18} />
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
