import React, { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Save,
  CreditCard,
} from "lucide-react";
import { supabase } from "../services/supabaseClient";

export default function MatricularAluno() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [aluno, setAluno] = useState(null);
  const [planos, setPlanos] = useState([]);
  const [matriculaAtual, setMatriculaAtual] = useState(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    plano_id: "",
    data_inicio:
      new Date().toISOString().split("T")[0],
    dia_vencimento: 10,
    valor_mensalidade: "",
  });

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const { data: alunoData, error: alunoError } =
        await supabase
          .from("alunos")
          .select("id, nome, faixa, grau, status")
          .eq("id", id)
          .single();

      if (alunoError) throw alunoError;

      setAluno(alunoData);

      const { data: planosData, error: planosError } =
        await supabase
          .from("planos")
          .select(`
            id,
            nome,
            valor,
            periodicidade,
            quantidade_aulas_semana
          `)
          .eq("ativo", true)
          .order("nome", { ascending: true });

      if (planosError) throw planosError;

      setPlanos(planosData || []);

      const {
        data: matriculaData,
        error: matriculaError,
      } = await supabase
        .from("matriculas")
        .select(`
          *,
          planos (
            nome,
            valor,
            periodicidade
          )
        `)
        .eq("aluno_id", id)
        .eq("status", "ativa")
        .order("data_inicio", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (matriculaError) throw matriculaError;

      setMatriculaAtual(matriculaData || null);

      if (matriculaData) {
        setForm({
          plano_id: matriculaData.plano_id || "",
          data_inicio:
            new Date().toISOString().split("T")[0],
          dia_vencimento:
            matriculaData.dia_vencimento || 10,
          valor_mensalidade:
            matriculaData.valor_mensalidade ??
            matriculaData.planos?.valor ??
            "",
        });
      }
    } catch (error) {
      console.error("Erro ao carregar matrícula:", error);
      alert(
        "Não foi possível carregar os dados da matrícula."
      );
      navigate(`/alunos/${id}`);
    } finally {
      setLoading(false);
    }
  };

  const alterarPlano = (planoId) => {
    const plano = planos.find(
      (item) => item.id === planoId
    );

    setForm((anterior) => ({
      ...anterior,
      plano_id: planoId,
      valor_mensalidade:
        plano?.valor !== undefined
          ? String(plano.valor)
          : "",
    }));
  };

  const salvar = async (e) => {
    e.preventDefault();

    if (!form.plano_id) {
      alert("Selecione um plano.");
      return;
    }

    const diaVencimento = Number(form.dia_vencimento);

    if (diaVencimento < 1 || diaVencimento > 31) {
      alert(
        "O dia de vencimento deve estar entre 1 e 31."
      );
      return;
    }

    const valor = Number(
      String(form.valor_mensalidade).replace(",", ".")
    );

    if (Number.isNaN(valor) || valor < 0) {
      alert(
        "Informe um valor válido para a mensalidade."
      );
      return;
    }

    if (
      matriculaAtual &&
      !window.confirm(
        "Este aluno já possui uma matrícula ativa. Deseja encerrar a matrícula atual e vincular o novo plano?"
      )
    ) {
      return;
    }

    try {
      setSalvando(true);

      if (matriculaAtual) {
        const { error: erroEncerrar } = await supabase
          .from("matriculas")
          .update({
            status: "inativa",
            data_fim: form.data_inicio,
          })
          .eq("id", matriculaAtual.id);

        if (erroEncerrar) throw erroEncerrar;
      }

      const { error } = await supabase
        .from("matriculas")
        .insert({
          aluno_id: id,
          plano_id: form.plano_id,
          data_inicio: form.data_inicio,
          dia_vencimento: diaVencimento,
          valor_mensalidade: valor,
          status: "ativa",
        });

      if (error) throw error;

      alert(
        matriculaAtual
          ? "Plano do aluno alterado com sucesso!"
          : "Matrícula realizada com sucesso!"
      );

      navigate(`/alunos/${id}`);
    } catch (error) {
      console.error("Erro ao salvar matrícula:", error);

      alert(
        `Erro ao salvar matrícula: ${
          error.message || "erro desconhecido"
        }`
      );
    } finally {
      setSalvando(false);
    }
  };

  const planoSelecionado = planos.find(
    (plano) => plano.id === form.plano_id
  );

  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  if (loading) {
    return (
      <div className="page-content">
        Carregando matrícula...
      </div>
    );
  }

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <button
            className="back-button"
            onClick={() => navigate(`/alunos/${id}`)}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>
            {matriculaAtual
              ? "Alterar plano"
              : "Matricular aluno"}
          </h1>

          <p>{aluno?.nome}</p>
        </div>
      </header>

      {matriculaAtual && (
        <section className="current-enrollment-card">
          <div className="current-enrollment-icon">
            <CreditCard size={22} />
          </div>

          <div>
            <span>Plano atual</span>

            <strong>
              {matriculaAtual.planos?.nome || "Plano"}
            </strong>

            <small>
              Valor:{" "}
              {formatarMoeda(
                matriculaAtual.valor_mensalidade ??
                  matriculaAtual.planos?.valor
              )}
              {" • "}
              Vencimento dia {matriculaAtual.dia_vencimento}
            </small>
          </div>
        </section>
      )}

      <form className="student-form" onSubmit={salvar}>
        <section className="form-card">
          <div className="form-section-title">
            <h2>
              {matriculaAtual
                ? "Novo plano"
                : "Dados da matrícula"}
            </h2>

            <p>
              Selecione o plano e defina o vencimento do aluno.
            </p>
          </div>

          {planos.length === 0 ? (
            <div className="empty-state">
              <strong>Nenhum plano ativo.</strong>
              <p>
                Cadastre um plano antes de matricular o aluno.
              </p>

              <button
                type="button"
                className="btn-primary"
                onClick={() =>
                  navigate("/financeiro/planos/novo")
                }
              >
                Cadastrar plano
              </button>
            </div>
          ) : (
            <div className="form-grid">
              <div className="form-field span-2">
                <label>Plano *</label>

                <select
                  value={form.plano_id}
                  onChange={(e) =>
                    alterarPlano(e.target.value)
                  }
                >
                  <option value="">
                    Selecione um plano
                  </option>

                  {planos.map((plano) => (
                    <option
                      key={plano.id}
                      value={plano.id}
                    >
                      {plano.nome} -{" "}
                      {formatarMoeda(plano.valor)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Data de início *</label>

                <input
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) =>
                    setForm((anterior) => ({
                      ...anterior,
                      data_inicio: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-field">
                <label>Dia do vencimento *</label>

                <input
                  type="number"
                  min="1"
                  max="31"
                  value={form.dia_vencimento}
                  onChange={(e) =>
                    setForm((anterior) => ({
                      ...anterior,
                      dia_vencimento: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-field">
                <label>Valor da mensalidade *</label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valor_mensalidade}
                  onChange={(e) =>
                    setForm((anterior) => ({
                      ...anterior,
                      valor_mensalidade: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-field">
                <label>Periodicidade</label>

                <input
                  value={
                    planoSelecionado?.periodicidade || ""
                  }
                  disabled
                />
              </div>

              {planoSelecionado && (
                <div className="form-field span-2">
                  <div className="selected-plan-info">
                    <strong>{planoSelecionado.nome}</strong>

                    <span>
                      Valor padrão:{" "}
                      {formatarMoeda(planoSelecionado.valor)}
                    </span>

                    <span>
                      Aulas por semana:{" "}
                      {planoSelecionado.quantidade_aulas_semana ??
                        "Livre"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {planos.length > 0 && (
          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate(`/alunos/${id}`)}
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
                : matriculaAtual
                  ? "Alterar plano"
                  : "Confirmar matrícula"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
