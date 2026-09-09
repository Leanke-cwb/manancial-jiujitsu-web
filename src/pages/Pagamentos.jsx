import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  ReceiptText,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

export default function Pagamentos() {
  const navigate = useNavigate();

  const [pagamentos, setPagamentos] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPagamentos();
  }, []);

  const carregarPagamentos = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("pagamentos")
        .select(`
          *,
          alunos (
            id,
            nome,
            cpf
          ),
          mensalidades (
            referencia,
            vencimento
          )
        `)
        .order("data_pagamento", { ascending: false });

      if (error) throw error;

      setPagamentos(data || []);
    } catch (error) {
      console.error("Erro ao carregar pagamentos:", error);
      alert("Não foi possível carregar os pagamentos.");
    } finally {
      setLoading(false);
    }
  };

  const lista = useMemo(() => {
    const texto = pesquisa.trim().toLowerCase();

    if (!texto) return pagamentos;

    return pagamentos.filter(
      (pagamento) =>
        pagamento.alunos?.nome?.toLowerCase().includes(texto) ||
        pagamento.alunos?.cpf?.toLowerCase().includes(texto)
    );
  }, [pagamentos, pesquisa]);

  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const formatarDataHora = (valor) =>
    valor
      ? new Date(valor).toLocaleString("pt-BR")
      : "-";

  const formaLabel = (forma) => {
    const labels = {
      pix: "PIX",
      dinheiro: "Dinheiro",
      credito: "Crédito",
      debito: "Débito",
      transferencia: "Transferência",
      outro: "Outro",
    };

    return labels[forma] || forma || "-";
  };

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <button
            className="back-button"
            onClick={() => navigate("/financeiro")}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>Pagamentos</h1>
          <p>Histórico de recebimentos da academia.</p>
        </div>
      </header>

      <section className="content-card">
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} />

            <input
              placeholder="Pesquisar aluno..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="table-message">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="empty-state">
            Nenhum pagamento registrado.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Data</th>
                  <th>Forma</th>
                  <th>Valor</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {lista.map((pagamento) => (
                  <tr key={pagamento.id}>
                    <td>{pagamento.alunos?.nome}</td>
                    <td>{formatarDataHora(pagamento.data_pagamento)}</td>
                    <td>{formaLabel(pagamento.forma_pagamento)}</td>
                    <td>
                      <strong>{formatarMoeda(pagamento.valor)}</strong>
                    </td>
                    <td>
                      <button
                        className="btn-table-primary"
                        onClick={() =>
                          navigate(
                            `/financeiro/pagamentos/${pagamento.id}/recibo`
                          )
                        }
                      >
                        <ReceiptText size={16} />
                        Recibo
                      </button>
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
