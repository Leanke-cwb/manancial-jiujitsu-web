import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "../services/supabaseClient";

const FORM_INICIAL = {
  nome: "",
  descricao: "",
  valor: "",
  periodicidade: "mensal",
  quantidade_aulas_semana: "",
  ativo: true,
};

export default function NovoPlano() {
  const navigate = useNavigate();
  const [form, setForm] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);

  const alterar = (campo, valor) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
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
        .insert({
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || null,
          valor,
          periodicidade: form.periodicidade,
          quantidade_aulas_semana:
            form.quantidade_aulas_semana === ""
              ? null
              : Number(form.quantidade_aulas_semana),
          ativo: form.ativo,
        });

      if (error) throw error;

      alert("Plano cadastrado com sucesso!");
      navigate("/financeiro/planos");
    } catch (error) {
      console.error("Erro ao cadastrar plano:", error);
      alert(
        `Erro ao cadastrar plano: ${
          error.message || "erro desconhecido"
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
            onClick={() => navigate("/financeiro/planos")}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>Novo plano</h1>
          <p>Cadastre um plano da academia.</p>
        </div>
      </header>

      <form className="student-form" onSubmit={salvar}>
        <section className="form-card">
          <div className="form-section-title">
            <h2>Dados do plano</h2>
            <p>Informe o nome, valor e periodicidade.</p>
          </div>

          <div className="form-grid">
            <div className="form-field span-2">
              <label>Nome do plano *</label>
              <input
                placeholder="Ex.: Mensal Adulto"
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
            {salvando ? "Salvando..." : "Salvar plano"}
          </button>
        </div>
      </form>
    </div>
  );
}
