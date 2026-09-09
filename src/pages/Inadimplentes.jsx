import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  CircleDollarSign,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

export default function Inadimplentes() {
  const navigate = useNavigate();

  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    try {
      setLoading(true);

      const hoje = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("mensalidades")
        .select(`
          *,
          alunos (
            id,
            nome,
            telefone,
            email
          ),
          matriculas (
            planos (
              nome
            )
          )
        `)
        .eq("status", "pendente")
        .lt("vencimento", hoje)
        .order("vencimento", { ascending: true });

      if (error) throw error;

      setLista(data || []);
    } catch (error) {
      console.error("Erro ao carregar inadimplentes:", error);
      alert("Não foi possível carregar os inadimplentes.");
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) =>
    data
      ? new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR")
      : "-";

  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const diasAtraso = (data) => {
    const vencimento = new Date(`${data}T12:00:00`);
    const hoje = new Date();

    hoje.setHours(12, 0, 0, 0);

    return Math.max(
      Math.floor((hoje - vencimento) / 86400000),
      0
    );
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

          <h1>Inadimplentes</h1>
          <p>Mensalidades vencidas e ainda não pagas.</p>
        </div>
      </header>

      <section className="content-card">
        {loading ? (
          <div className="table-message">Carregando...</div>
        ) : lista.length === 0 ? (
          <div className="empty-state">
            <AlertTriangle size={30} />
            <strong>Nenhuma mensalidade vencida.</strong>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Plano</th>
                  <th>Vencimento</th>
                  <th>Atraso</th>
                  <th>Valor</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {lista.map((mensalidade) => {
                  const total =
                    Number(mensalidade.valor) -
                    Number(mensalidade.desconto || 0) +
                    Number(mensalidade.acrescimo || 0);

                  return (
                    <tr key={mensalidade.id}>
                      <td>
                        <button
                          className="student-name-link"
                          onClick={() =>
                            navigate(`/alunos/${mensalidade.aluno_id}`)
                          }
                        >
                          {mensalidade.alunos?.nome}
                        </button>
                      </td>

                      <td>
                        {mensalidade.matriculas?.planos?.nome || "-"}
                      </td>

                      <td>{formatarData(mensalidade.vencimento)}</td>

                      <td>
                        <span className="late-days">
                          {diasAtraso(mensalidade.vencimento)} dias
                        </span>
                      </td>

                      <td>
                        <strong>{formatarMoeda(total)}</strong>
                      </td>

                      <td>
                        <button
                          className="btn-table-primary"
                          onClick={() =>
                            navigate(
                              `/financeiro/mensalidades/${mensalidade.id}/pagar`
                            )
                          }
                        >
                          <CircleDollarSign size={16} />
                          Pagar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
