import React, { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "../services/supabaseClient";

export default function EditarPlano() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    valor: "",
    periodicidade: "mensal",
    quantidade_aulas_semana: "",
    ativo: true,
  });

  useEffect(() => {
    carregarPlano();
  }, [id]);

  const alterar = (campo, valor) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const carregarPlano = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("planos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setForm({
        nome: data.nome || "",
        descricao: data.descricao || "",
        valor:
          data.valor !== null
            ? String(data.valor)
            : "",
        periodicidade:
          data.periodicidade || "mensal",
        quantidade_aulas_semana:
          data.quantidade_aulas_semana ?? "",
        ativo: data.ativo !== false,
      });
    } catch (error) {
      console.error("Erro ao carregar plano:", error);
      alert("Não foi possível carregar o plano.");
      navigate("/financeiro/planos");
    } finally {
      setLoading(false);
    }
  };

  const salvar = async (e) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome do plano.");
      return;
    }

    const valor = Number(String(form.valor).replace(",", "."));

    if (Number.isNaN(valor) || valor < 0) {
      alert("Informe um valor válido para o plano.");
      return;
    }

    try {
      setSalvando(true);

      const { error } = await supabase
        .from("planos")
        .update({
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || null,
          valor,
          periodicidade: form.periodicidade,
          quantidade_aulas_semana:
            form.quantidade_aulas_semana === ""
              ? null
              : Number(form.quantidade_aulas_semana),
          ativo: form.ativo,
        })
        .eq("id", id);

      if (error) throw error;

      alert("Plano atualizado com sucesso!");
      navigate("/financeiro/planos");
    } catch (error) {
      console.error("Erro ao atualizar plano:", error);
      alert(
        `Erro ao atualizar plano: ${
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
        Carregando plano...
      </div>
    );
  }

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <button
            className="back-button"
            onClick={() => navigate("/financeiro/planos")}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>Editar plano</h1>
          <p>{form.nome}</p>
        </div>
      </header>

      <form className="student-form" onSubmit={salvar}>
        <section className="form-card">
          <div className="form-section-title">
            <h2>Dados do plano</h2>
          </div>

          <div className="form-grid">
            <div className="form-field span-2">
              <label>Nome do plano *</label>
              <input
                value={form.nome}
                onChange={(e) => alterar("nome", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Valor *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.valor}
                onChange={(e) => alterar("valor", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Periodicidade</label>
              <select
                value={form.periodicidade}
                onChange={(e) =>
                  alterar("periodicidade", e.target.value)
                }
              >
                <option value="mensal">Mensal</option>
                <option value="trimestral">Trimestral</option>
                <option value="semestral">Semestral</option>
                <option value="anual">Anual</option>
                <option value="avulso">Avulso</option>
              </select>
            </div>

            <div className="form-field">
              <label>Aulas por semana</label>
              <input
                type="number"
                min="1"
                max="7"
                value={form.quantidade_aulas_semana}
                onChange={(e) =>
                  alterar(
                    "quantidade_aulas_semana",
                    e.target.value
                  )
                }
              />
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

            <div className="form-field span-2">
              <label>Descrição</label>
              <textarea
                rows={4}
                value={form.descricao}
                onChange={(e) =>
                  alterar("descricao", e.target.value)
                }
              />
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/financeiro/planos")}
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
