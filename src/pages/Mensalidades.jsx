import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarPlus,
  Search,
  CircleDollarSign,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";
import { gerarMensalidades } from "../services/mensalidades";

export default function Mensalidades() {
  const navigate = useNavigate();

  const mesAtual = new Date().toISOString().slice(0, 7);

  const [referencia, setReferencia] = useState(mesAtual);
  const [mensalidades, setMensalidades] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    carregarMensalidades();
  }, [referencia]);

  const carregarMensalidades = async () => {
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
            id,
            planos (
              nome
            )
          )
        `)
        .eq("referencia", `${referencia}-01`)
        .order("vencimento", { ascending: true });

      if (error) throw error;

      setMensalidades(data || []);
    } catch (error) {
      console.error("Erro ao carregar mensalidades:", error);
      alert("Não foi possível carregar as mensalidades.");
    } finally {
      setLoading(false);
    }
  };

  const handleGerar = async () => {
    if (
      !window.confirm(
        `Deseja gerar as cobranças da referência ${referencia}?`
      )
    ) {
      return;
    }

    try {
      setGerando(true);

      const resultado = await gerarMensalidades(referencia);

      alert(
        `Geração concluída.\n\nNovas: ${resultado.geradas}\nJá existentes: ${resultado.existentes}`
      );

      await carregarMensalidades();
    } catch (error) {
      console.error("Erro ao gerar mensalidades:", error);

      alert(
        `Erro ao gerar mensalidades: ${
          error.message || "erro desconhecido"
        }`
      );
    } finally {
      setGerando(false);
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

  const hoje = new Date().toISOString().split("T")[0];

  const statusVisual = (mensalidade) => {
    if (
      mensalidade.status === "pendente" &&
      mensalidade.vencimento < hoje
    ) {
      return "atrasado";
    }

    return mensalidade.status;
  };

  const listaFiltrada = useMemo(() => {
    const texto = pesquisa.trim().toLowerCase();

    return mensalidades.filter((mensalidade) => {
      const status = statusVisual(mensalidade);

      const statusOk =
        filtro === "todos" || status === filtro;

      const buscaOk =
        !texto ||
        mensalidade.alunos?.nome?.toLowerCase().includes(texto) ||
        mensalidade.alunos?.cpf?.toLowerCase().includes(texto);

      return statusOk && buscaOk;
    });
  }, [mensalidades, pesquisa, filtro]);

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

          <h1>Mensalidades</h1>
          <p>Gere e acompanhe as cobranças dos alunos.</p>
        </div>

        <button
          className="btn-primary"
          onClick={handleGerar}
          disabled={gerando}
        >
          <CalendarPlus size={18} />
          {gerando ? "Gerando..." : "Gerar mensalidades"}
        </button>
      </header>

      <section className="content-card">
        <div className="monthly-toolbar">
          <div className="form-field monthly-reference">
            <label>Referência</label>

            <input
              type="month"
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
            />
          </div>

          <div className="search-box">
            <Search size={18} />

            <input
              placeholder="Pesquisar aluno..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="atrasado">Atrasados</option>
            <option value="pago">Pagos</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        {loading ? (
          <div className="table-message">Carregando...</div>
        ) : listaFiltrada.length === 0 ? (
          <div className="empty-state">
            Nenhuma mensalidade encontrada para esta referência.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Plano</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {listaFiltrada.map((mensalidade) => {
                  const total =
                    Number(mensalidade.valor) -
                    Number(mensalidade.desconto || 0) +
                    Number(mensalidade.acrescimo || 0);

                  const status = statusVisual(mensalidade);

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
                        <strong>{formatarMoeda(total)}</strong>
                      </td>

                      <td>
                        <span
                          className={`finance-status finance-${status}`}
                        >
                          {status}
                        </span>
                      </td>

                      <td>
                        {mensalidade.status === "pendente" && (
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
                        )}
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
