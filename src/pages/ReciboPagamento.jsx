import React, { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";

import { supabase } from "../services/supabaseClient";

export default function ReciboPagamento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pagamento, setPagamento] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
  }, [id]);

  const carregar = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("pagamentos")
        .select(`
          *,
          alunos (
            nome,
            cpf
          ),
          mensalidades (
            referencia,
            vencimento,
            valor,
            desconto,
            acrescimo
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      setPagamento(data);
    } catch (error) {
      console.error("Erro ao carregar recibo:", error);
      alert("Não foi possível carregar o recibo.");
      navigate("/financeiro/pagamentos");
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const formatarData = (data) =>
    data
      ? new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR")
      : "-";

  const formatarDataHora = (data) =>
    data
      ? new Date(data).toLocaleString("pt-BR")
      : "-";

  const formaLabel = (forma) => {
    const labels = {
      pix: "PIX",
      dinheiro: "Dinheiro",
      credito: "Cartão de crédito",
      debito: "Cartão de débito",
      transferencia: "Transferência",
      outro: "Outro",
    };

    return labels[forma] || forma || "-";
  };

  if (loading) {
    return (
      <div className="page-content">
        Carregando recibo...
      </div>
    );
  }

  if (!pagamento) return null;

  return (
    <div className="page-content receipt-page">
      <div className="receipt-actions no-print">
        <button
          className="back-button"
          onClick={() => navigate("/financeiro/pagamentos")}
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <button
          className="btn-primary"
          onClick={() => window.print()}
        >
          <Printer size={18} />
          Imprimir / Salvar PDF
        </button>
      </div>

      <section className="receipt-card">
        <header className="receipt-header">
          <div>
            <h1>MANANCIAL</h1>
            <span>JIU JITSU</span>
          </div>

          <strong>RECIBO</strong>
        </header>

        <div className="receipt-number">
          Pagamento: {pagamento.id}
        </div>

        <p className="receipt-text">
          Recebemos de{" "}
          <strong>{pagamento.alunos?.nome}</strong>
          {pagamento.alunos?.cpf
            ? `, CPF ${pagamento.alunos.cpf},`
            : ","}{" "}
          o valor de{" "}
          <strong>{formatarMoeda(pagamento.valor)}</strong>
          , referente à mensalidade de{" "}
          <strong>
            {formatarData(pagamento.mensalidades?.referencia)}
          </strong>
          .
        </p>

        <div className="receipt-details">
          <div>
            <span>Data do pagamento</span>
            <strong>{formatarDataHora(pagamento.data_pagamento)}</strong>
          </div>

          <div>
            <span>Forma de pagamento</span>
            <strong>{formaLabel(pagamento.forma_pagamento)}</strong>
          </div>

          <div>
            <span>Valor recebido</span>
            <strong>{formatarMoeda(pagamento.valor)}</strong>
          </div>

          <div>
            <span>Vencimento original</span>
            <strong>
              {formatarData(pagamento.mensalidades?.vencimento)}
            </strong>
          </div>
        </div>

        {pagamento.observacoes && (
          <div className="receipt-observation">
            <span>Observações</span>
            <p>{pagamento.observacoes}</p>
          </div>
        )}

        <footer className="receipt-footer">
          <div className="receipt-signature">
            <div />
            <span>Manancial Jiu Jitsu</span>
          </div>
        </footer>
      </section>
    </div>
  );
}
