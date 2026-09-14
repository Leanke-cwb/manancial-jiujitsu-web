import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Search,
  Banknote,
  ReceiptText,
  CreditCard,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";
import {
  baixarCSV,
  formatarMoeda,
  formatarDataHora,
  hojeISO,
  inicioMesISO,
  inicioDiaTimestamp,
  fimDiaTimestamp,
} from "./relatorioUtils";

export default function RelatorioFinanceiro() {
  const navigate = useNavigate();

  const [inicio, setInicio] = useState(inicioMesISO());
  const [fim, setFim] = useState(hojeISO());
  const [pesquisa, setPesquisa] = useState("");
  const [pagamentos, setPagamentos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    if (!inicio || !fim) {
      alert("Informe o período.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("pagamentos")
        .select(`
          id,
          valor,
          forma_pagamento,
          data_pagamento,
          observacoes,
          alunos (
            id,
            nome
          )
        `)
        .gte(
          "data_pagamento",
          inicioDiaTimestamp(inicio)
        )
        .lte(
          "data_pagamento",
          fimDiaTimestamp(fim)
        )
        .order("data_pagamento", {
          ascending: false,
        });

      if (error) throw error;

      setPagamentos(data || []);
    } catch (error) {
      console.error("Erro ao carregar relatório financeiro:", error);
      alert(
        `Erro ao carregar relatório: ${
          error.message || "erro desconhecido"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const filtrados = useMemo(() => {
    const texto = pesquisa.trim().toLowerCase();

    if (!texto) return pagamentos;

    return pagamentos.filter((item) => {
      return (
        item.alunos?.nome?.toLowerCase().includes(texto) ||
        item.forma_pagamento?.toLowerCase().includes(texto)
      );
    });
  }, [pagamentos, pesquisa]);

  const total = filtrados.reduce(
    (soma, item) =>
      soma + Number(item.valor || 0),
    0
  );

  const ticketMedio =
    filtrados.length > 0
      ? total / filtrados.length
      : 0;

  const formas = new Set(
    filtrados
      .map((item) => item.forma_pagamento)
      .filter(Boolean)
  ).size;

  const exportar = () => {
    baixarCSV(
      `relatorio_financeiro_${inicio}_${fim}.csv`,
      [
        "Data",
        "Aluno",
        "Forma de pagamento",
        "Valor",
        "Observações",
      ],
      filtrados.map((item) => [
        formatarDataHora(item.data_pagamento),
        item.alunos?.nome || "",
        item.forma_pagamento || "",
        Number(item.valor || 0).toFixed(2).replace(".", ","),
        item.observacoes || "",
      ])
    );
  };

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <button
            className="back-button"
            onClick={() => navigate("/relatorios")}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>Relatório Financeiro</h1>
          <p>
            Pagamentos recebidos no período selecionado.
          </p>
        </div>

        <button
          className="btn-secondary"
          disabled={filtrados.length === 0}
          onClick={exportar}
        >
          <Download size={18} />
          Exportar CSV
        </button>
      </header>

      <section className="content-card report-filter-card">
        <div className="report-filter-grid">
          <div className="form-field">
            <label>Data inicial</label>
            <input
              type="date"
              value={inicio}
              onChange={(e) => setInicio(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Data final</label>
            <input
              type="date"
              value={fim}
              onChange={(e) => setFim(e.target.value)}
            />
          </div>

          <button
            className="btn-primary report-filter-button"
            onClick={carregar}
            disabled={loading}
          >
            {loading ? "Carregando..." : "Aplicar filtro"}
          </button>
        </div>
      </section>

      <div className="report-summary-grid">
        <div className="report-summary-card">
          <Banknote size={20} />
          <span>Total recebido</span>
          <strong>{formatarMoeda(total)}</strong>
        </div>

        <div className="report-summary-card">
          <ReceiptText size={20} />
          <span>Pagamentos</span>
          <strong>{filtrados.length}</strong>
        </div>

        <div className="report-summary-card">
          <CreditCard size={20} />
          <span>Ticket médio</span>
          <strong>{formatarMoeda(ticketMedio)}</strong>
        </div>

        <div className="report-summary-card">
          <CreditCard size={20} />
          <span>Formas utilizadas</span>
          <strong>{formas}</strong>
        </div>
      </div>

      <section className="content-card">
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Pesquisar aluno ou forma de pagamento..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>
        </div>

        {filtrados.length === 0 ? (
          <div className="empty-state">
            Nenhum pagamento encontrado no período.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Aluno</th>
                  <th>Forma</th>
                  <th>Valor</th>
                  <th>Observações</th>
                </tr>
              </thead>

              <tbody>
                {filtrados.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {formatarDataHora(item.data_pagamento)}
                    </td>
                    <td>
                      {item.alunos?.nome || "-"}
                    </td>
                    <td>
                      {item.forma_pagamento || "-"}
                    </td>
                    <td>
                      <strong>
                        {formatarMoeda(item.valor)}
                      </strong>
                    </td>
                    <td>
                      {item.observacoes || "-"}
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
