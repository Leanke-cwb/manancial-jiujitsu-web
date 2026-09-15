import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, ReceiptText } from "lucide-react";

import { supabase } from "../services/supabaseClient";
import {
  obterConfiguracoesAcademia,
  obterUrlLogoAcademia,
} from "../services/configuracoesAcademia";

import "../styles/reciboPagamento.css";

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarDataHora(data) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

function formatarReferencia(data) {
  if (!data) return "-";
  const valor = new Date(`${data}T12:00:00`);
  return valor.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function formatarFormaPagamento(forma) {
  const mapa = {
    pix: "PIX",
    dinheiro: "Dinheiro",
    credito: "Cartão de crédito",
    debito: "Cartão de débito",
    transferencia: "Transferência",
    outro: "Outro",
  };
  return mapa[forma] || forma || "-";
}

function montarEndereco(config) {
  if (!config) return "";

  const linha1 = [config.endereco, config.numero]
    .filter(Boolean)
    .join(", ");

  const linha2 = [config.bairro, config.cidade, config.estado]
    .filter(Boolean)
    .join(" - ");

  const linha3 = config.cep ? `CEP ${config.cep}` : "";

  return [linha1, config.complemento, linha2, linha3]
    .filter(Boolean)
    .join(" • ");
}

export default function ReciboPagamento() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pagamento, setPagamento] = useState(null);
  const [aluno, setAluno] = useState(null);
  const [mensalidade, setMensalidade] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
  }, [id]);

  const carregar = async () => {
    try {
      setLoading(true);

      const [pagamentoRes, configuracao] = await Promise.all([
        supabase
          .from("pagamentos")
          .select(`
            id,
            mensalidade_id,
            aluno_id,
            valor,
            forma_pagamento,
            data_pagamento,
            observacoes,
            created_at
          `)
          .eq("id", id)
          .single(),

        obterConfiguracoesAcademia(),
      ]);

      if (pagamentoRes.error) throw pagamentoRes.error;

      const pagamentoData = pagamentoRes.data;
      setPagamento(pagamentoData);
      setConfig(configuracao);

      if (pagamentoData?.aluno_id) {
        const { data, error } = await supabase
          .from("alunos")
          .select("id, nome, cpf, telefone, email")
          .eq("id", pagamentoData.aluno_id)
          .maybeSingle();

        if (error) throw error;
        setAluno(data || null);
      }

      if (pagamentoData?.mensalidade_id) {
        const { data, error } = await supabase
          .from("mensalidades")
          .select(`
            id,
            referencia,
            vencimento,
            valor,
            desconto,
            acrescimo,
            status,
            matricula_id
          `)
          .eq("id", pagamentoData.mensalidade_id)
          .maybeSingle();

        if (error) throw error;
        setMensalidade(data || null);
      }
    } catch (error) {
      console.error("Erro ao carregar recibo:", error);

      alert(
        `Erro ao carregar recibo: ${
          error.message || "erro desconhecido"
        }`
      );

      navigate("/financeiro/pagamentos");
    } finally {
      setLoading(false);
    }
  };

  const logoUrl = useMemo(
    () => obterUrlLogoAcademia(config?.logo_path),
    [config?.logo_path]
  );

  const enderecoAcademia = useMemo(
    () => montarEndereco(config),
    [config]
  );

  const numeroRecibo = pagamento?.id
    ? pagamento.id.replace(/-/g, "").slice(0, 10).toUpperCase()
    : "-";

  if (loading) {
    return <div className="page-content">Carregando recibo...</div>;
  }

  if (!pagamento) return null;

  return (
    <div className="page-content receipt-page">
      <div className="receipt-toolbar no-print">
        <button
          className="btn-secondary"
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

      <article className="academy-receipt">
        <header className="academy-receipt-header">
          <div className="academy-receipt-brand">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo da academia"
                className="academy-receipt-logo"
              />
            ) : (
              <div className="academy-receipt-logo-placeholder">
                <ReceiptText size={34} />
              </div>
            )}

            <div>
              <h1>
                {config?.nome_academia || "Manancial Jiu Jitsu"}
              </h1>

              {config?.documento && (
                <p>CNPJ/CPF: {config.documento}</p>
              )}

              {(config?.telefone || config?.email) && (
                <p>
                  {[config.telefone, config.email]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              )}

              {enderecoAcademia && <p>{enderecoAcademia}</p>}
            </div>
          </div>

          <div className="academy-receipt-number">
            <span>RECIBO</span>
            <strong>#{numeroRecibo}</strong>
          </div>
        </header>

        <div className="academy-receipt-divider" />

        <section className="academy-receipt-title">
          <h2>Recibo de Pagamento</h2>
          <p>
            Recebemos de{" "}
            <strong>{aluno?.nome || "Aluno não identificado"}</strong>{" "}
            o valor abaixo descrito.
          </p>
        </section>

        <div className="academy-receipt-value">
          <span>Valor recebido</span>
          <strong>{formatarMoeda(pagamento.valor)}</strong>
        </div>

        <section className="academy-receipt-details">
          <div>
            <span>Aluno</span>
            <strong>{aluno?.nome || "-"}</strong>
          </div>

          {aluno?.cpf && (
            <div>
              <span>CPF</span>
              <strong>{aluno.cpf}</strong>
            </div>
          )}

          <div>
            <span>Forma de pagamento</span>
            <strong>
              {formatarFormaPagamento(pagamento.forma_pagamento)}
            </strong>
          </div>

          <div>
            <span>Data do pagamento</span>
            <strong>
              {formatarDataHora(pagamento.data_pagamento)}
            </strong>
          </div>

          {mensalidade && (
            <>
              <div>
                <span>Referência</span>
                <strong>
                  {formatarReferencia(mensalidade.referencia)}
                </strong>
              </div>

              <div>
                <span>Vencimento</span>
                <strong>
                  {mensalidade.vencimento
                    ? new Date(
                        `${mensalidade.vencimento}T12:00:00`
                      ).toLocaleDateString("pt-BR")
                    : "-"}
                </strong>
              </div>
            </>
          )}
        </section>

        {pagamento.observacoes && (
          <section className="academy-receipt-observation">
            <span>Observações do pagamento</span>
            <p>{pagamento.observacoes}</p>
          </section>
        )}

        {(config?.pix_chave || config?.recibo_observacoes) && (
          <section className="academy-receipt-footer-info">
            {config?.pix_chave && (
              <div>
                <span>Chave PIX da academia</span>
                <strong>{config.pix_chave}</strong>
              </div>
            )}

            {config?.recibo_observacoes && (
              <p>{config.recibo_observacoes}</p>
            )}
          </section>
        )}

        <footer className="academy-receipt-footer">
          <div className="academy-receipt-signature">
            <div />

            <strong>
              {config?.responsavel_nome ||
                config?.nome_academia ||
                "Manancial Jiu Jitsu"}
            </strong>

            <span>Responsável pelo recebimento</span>
          </div>

          <p>
            Recibo emitido eletronicamente pelo sistema
            Manancial Jiu Jitsu.
          </p>
        </footer>
      </article>
    </div>
  );
}
