import React, { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";

import { supabase } from "../services/supabaseClient";

function datetimeLocalAgora() {
  const agora = new Date();
  const offset = agora.getTimezoneOffset();

  const local = new Date(
    agora.getTime() - offset * 60 * 1000
  );

  return local.toISOString().slice(0, 16);
}

export default function RegistrarPagamento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [mensalidade, setMensalidade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    desconto: "0",
    acrescimo: "0",
    forma_pagamento: "pix",
    data_pagamento: datetimeLocalAgora(),
    observacoes: "",
  });

  useEffect(() => {
    carregarMensalidade();
  }, [id]);

  const carregarMensalidade = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("mensalidades")
        .select(`
          *,
          alunos (
            id,
            nome,
            cpf
          ),
          matriculas (
            planos (
              nome
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      setMensalidade(data);

      setForm((anterior) => ({
        ...anterior,
        desconto: String(data.desconto || 0),
        acrescimo: String(data.acrescimo || 0),
      }));
    } catch (error) {
      console.error("Erro ao carregar cobrança:", error);
      alert("Não foi possível carregar a cobrança.");
      navigate("/financeiro/mensalidades");
    } finally {
      setLoading(false);
    }
  };

  const total = useMemo(() => {
    if (!mensalidade) return 0;

    return Math.max(
      Number(mensalidade.valor || 0) -
        Number(form.desconto || 0) +
        Number(form.acrescimo || 0),
      0
    );
  }, [mensalidade, form.desconto, form.acrescimo]);

  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const formatarData = (data) =>
    data
      ? new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR")
      : "-";

  const salvar = async (e) => {
    e.preventDefault();

    if (mensalidade.status !== "pendente") {
      alert("Esta mensalidade não está pendente.");
      return;
    }

    const desconto = Number(form.desconto || 0);
    const acrescimo = Number(form.acrescimo || 0);

    if (desconto < 0 || acrescimo < 0) {
      alert("Desconto e acréscimo não podem ser negativos.");
      return;
    }

    if (!form.data_pagamento) {
      alert("Informe a data do pagamento.");
      return;
    }

    try {
      setSalvando(true);

      const dataPagamento = new Date(
        form.data_pagamento
      ).toISOString();

      const { data: pagamento, error: erroPagamento } =
        await supabase
          .from("pagamentos")
          .insert({
            mensalidade_id: id,
            aluno_id: mensalidade.aluno_id,
            valor: total,
            forma_pagamento: form.forma_pagamento,
            data_pagamento: dataPagamento,
            observacoes:
              form.observacoes.trim() || null,
          })
          .select("id")
          .single();

      if (erroPagamento) throw erroPagamento;

      const { error: erroMensalidade } =
        await supabase
          .from("mensalidades")
          .update({
            desconto,
            acrescimo,
            status: "pago",
            pago_em: dataPagamento,
          })
          .eq("id", id);

      if (erroMensalidade) {
        await supabase
          .from("pagamentos")
          .delete()
          .eq("id", pagamento.id);

        throw erroMensalidade;
      }

      alert("Pagamento registrado com sucesso!");

      navigate(
        `/financeiro/pagamentos/${pagamento.id}/recibo`
      );
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);

      alert(
        `Erro ao registrar pagamento: ${
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
        Carregando cobrança...
      </div>
    );
  }

  if (!mensalidade) return null;

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <button
            className="back-button"
            onClick={() => navigate("/financeiro/mensalidades")}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>Registrar pagamento</h1>
          <p>{mensalidade.alunos?.nome}</p>
        </div>
      </header>

      <div className="payment-layout">
        <section className="form-card">
          <div className="form-section-title">
            <h2>Dados da cobrança</h2>
          </div>

          <div className="detail-grid">
            <div>
              <span>Aluno</span>
              <strong>{mensalidade.alunos?.nome}</strong>
            </div>

            <div>
              <span>Plano</span>
              <strong>
                {mensalidade.matriculas?.planos?.nome || "-"}
              </strong>
            </div>

            <div>
              <span>Referência</span>
              <strong>{formatarData(mensalidade.referencia)}</strong>
            </div>

            <div>
              <span>Vencimento</span>
              <strong>{formatarData(mensalidade.vencimento)}</strong>
            </div>

            <div>
              <span>Valor original</span>
              <strong>{formatarMoeda(mensalidade.valor)}</strong>
            </div>
          </div>
        </section>

        <form className="form-card" onSubmit={salvar}>
          <div className="form-section-title">
            <h2>Pagamento</h2>
            <p>Informe a forma e eventuais ajustes.</p>
          </div>

          <div className="form-grid payment-form-grid">
            <div className="form-field">
              <label>Desconto</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.desconto}
                onChange={(e) =>
                  setForm((anterior) => ({
                    ...anterior,
                    desconto: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-field">
              <label>Acréscimo</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.acrescimo}
                onChange={(e) =>
                  setForm((anterior) => ({
                    ...anterior,
                    acrescimo: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-field">
              <label>Forma de pagamento</label>
              <select
                value={form.forma_pagamento}
                onChange={(e) =>
                  setForm((anterior) => ({
                    ...anterior,
                    forma_pagamento: e.target.value,
                  }))
                }
              >
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="credito">Cartão de crédito</option>
                <option value="debito">Cartão de débito</option>
                <option value="transferencia">Transferência</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div className="form-field">
              <label>Data do pagamento</label>
              <input
                type="datetime-local"
                value={form.data_pagamento}
                onChange={(e) =>
                  setForm((anterior) => ({
                    ...anterior,
                    data_pagamento: e.target.value,
                  }))
                }
              />
            </div>

            <div className="form-field span-2">
              <label>Observações</label>
              <textarea
                rows={4}
                value={form.observacoes}
                onChange={(e) =>
                  setForm((anterior) => ({
                    ...anterior,
                    observacoes: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="payment-total-box">
            <span>Total a receber</span>
            <strong>{formatarMoeda(total)}</strong>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/financeiro/mensalidades")}
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
                ? "Registrando..."
                : "Confirmar pagamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
