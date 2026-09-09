import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Pencil,
  Power,
  PowerOff,
} from "lucide-react";
import { supabase } from "../services/supabaseClient";

export default function Planos() {
  const navigate = useNavigate();

  const [planos, setPlanos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarPlanos();
  }, []);

  const carregarPlanos = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("planos")
        .select("*")
        .order("ativo", { ascending: false })
        .order("nome", { ascending: true });

      if (error) throw error;

      setPlanos(data || []);
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
      alert("Não foi possível carregar os planos.");
    } finally {
      setLoading(false);
    }
  };

  const alterarStatus = async (plano) => {
    const novoStatus = !plano.ativo;

    const mensagem = novoStatus
      ? `Deseja reativar o plano "${plano.nome}"?`
      : `Deseja inativar o plano "${plano.nome}"?`;

    if (!window.confirm(mensagem)) return;

    try {
      const { error } = await supabase
        .from("planos")
        .update({ ativo: novoStatus })
        .eq("id", plano.id);

      if (error) throw error;

      setPlanos((lista) =>
        lista.map((item) =>
          item.id === plano.id
            ? { ...item, ativo: novoStatus }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao alterar plano:", error);
      alert("Não foi possível alterar o status do plano.");
    }
  };

  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const periodicidadeLabel = (valor) => {
    const labels = {
      mensal: "Mensal",
      trimestral: "Trimestral",
      semestral: "Semestral",
      anual: "Anual",
      avulso: "Avulso",
    };

    return labels[valor] || valor;
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

          <h1>Planos</h1>
          <p>
            Planos e valores oferecidos pela Manancial Jiu Jitsu.
          </p>
        </div>

        <button
          className="btn-primary"
          onClick={() => navigate("/financeiro/planos/novo")}
        >
          <Plus size={18} />
          Novo plano
        </button>
      </header>

      <section className="content-card">
        {loading ? (
          <div className="table-message">
            Carregando planos...
          </div>
        ) : planos.length === 0 ? (
          <div className="empty-state">
            <strong>Nenhum plano cadastrado.</strong>
            <p>Cadastre o primeiro plano da academia.</p>

            <button
              className="btn-primary"
              onClick={() => navigate("/financeiro/planos/novo")}
            >
              <Plus size={18} />
              Cadastrar plano
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Plano</th>
                  <th>Valor</th>
                  <th>Periodicidade</th>
                  <th>Aulas / semana</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {planos.map((plano) => (
                  <tr key={plano.id}>
                    <td>
                      <div className="plan-name">
                        <strong>{plano.nome}</strong>
                        <span>
                          {plano.descricao || "Sem descrição"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <strong>{formatarMoeda(plano.valor)}</strong>
                    </td>

                    <td>
                      {periodicidadeLabel(plano.periodicidade)}
                    </td>

                    <td>
                      {plano.quantidade_aulas_semana ?? "Livre"}
                    </td>

                    <td>
                      <span
                        className={`status-badge ${
                          plano.ativo
                            ? "status-ativo"
                            : "status-inativo"
                        }`}
                      >
                        {plano.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          title="Editar plano"
                          onClick={() =>
                            navigate(
                              `/financeiro/planos/${plano.id}/editar`
                            )
                          }
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          className="icon-button"
                          title={
                            plano.ativo
                              ? "Inativar plano"
                              : "Reativar plano"
                          }
                          onClick={() => alterarStatus(plano)}
                        >
                          {plano.ativo ? (
                            <PowerOff size={17} />
                          ) : (
                            <Power size={17} />
                          )}
                        </button>
                      </div>
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
