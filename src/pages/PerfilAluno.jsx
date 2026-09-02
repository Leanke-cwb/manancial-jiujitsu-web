import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Pencil,
  User,
  CreditCard,
  ClipboardCheck,
  Award,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

import {
  obterUrlFotoAluno,
} from "../services/fotoAluno";

export default function PerfilAluno() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [aba, setAba] =
    useState("dados");

  const [aluno, setAluno] =
    useState(null);

  const [fotoUrl, setFotoUrl] =
    useState(null);

  const [matricula, setMatricula] =
    useState(null);

  const [mensalidades, setMensalidades] =
    useState([]);

  const [presencas, setPresencas] =
    useState([]);

  const [totalPresencas, setTotalPresencas] =
    useState(0);

  const [graduacoes, setGraduacoes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    carregarPerfil();
  }, [id]);

  const carregarPerfil = async () => {
    try {
      setLoading(true);

      const {
        data: alunoData,
        error: alunoError,
      } = await supabase
        .from("alunos")
        .select(`
          *,
          responsaveis (
            id,
            nome,
            cpf,
            telefone,
            email,
            parentesco
          )
        `)
        .eq("id", id)
        .single();

      if (alunoError) throw alunoError;

      setAluno(alunoData);

      if (alunoData.foto_url) {
        const url =
          await obterUrlFotoAluno(
            alunoData.foto_url
          );

        setFotoUrl(url);
      } else {
        setFotoUrl(null);
      }

      const {
        data: matriculaData,
        error: matriculaError,
      } = await supabase
        .from("matriculas")
        .select(`
          *,
          planos (
            id,
            nome,
            valor,
            periodicidade
          )
        `)
        .eq("aluno_id", id)
        .eq("status", "ativa")
        .order("data_inicio", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (matriculaError) {
        throw matriculaError;
      }

      setMatricula(
        matriculaData || null
      );

      const {
        data: mensalidadesData,
        error: mensalidadesError,
      } = await supabase
        .from("mensalidades")
        .select("*")
        .eq("aluno_id", id)
        .order("vencimento", {
          ascending: false,
        })
        .limit(12);

      if (mensalidadesError) {
        throw mensalidadesError;
      }

      setMensalidades(
        mensalidadesData || []
      );

      const {
        data: presencasData,
        error: presencasError,
      } = await supabase
        .from("presencas")
        .select(`
          *,
          turmas (
            nome
          )
        `)
        .eq("aluno_id", id)
        .order("data", {
          ascending: false,
        })
        .order("horario", {
          ascending: false,
        })
        .limit(20);

      if (presencasError) {
        throw presencasError;
      }

      setPresencas(
        presencasData || []
      );

      const {
        count,
        error: countError,
      } = await supabase
        .from("presencas")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("aluno_id", id);

      if (countError) throw countError;

      setTotalPresencas(count || 0);

      const {
        data: graduacoesData,
        error: graduacoesError,
      } = await supabase
        .from("graduacoes")
        .select(`
          *,
          professores (
            nome
          )
        `)
        .eq("aluno_id", id)
        .order("data_graduacao", {
          ascending: false,
        });

      if (graduacoesError) {
        throw graduacoesError;
      }

      setGraduacoes(
        graduacoesData || []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar perfil:",
        error
      );

      alert(
        "Não foi possível carregar o perfil do aluno."
      );

      navigate("/alunos");
    } finally {
      setLoading(false);
    }
  };

  const formatarData = (data) => {
    if (!data) return "-";

    return new Date(
      `${data}T12:00:00`
    ).toLocaleDateString("pt-BR");
  };

  const formatarMoeda = (valor) => {
    return Number(
      valor || 0
    ).toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  };

  const hoje =
    new Date()
      .toISOString()
      .split("T")[0];

  const possuiPendencia =
    mensalidades.some(
      (mensalidade) =>
        mensalidade.status === "pendente" &&
        mensalidade.vencimento < hoje
    );

  if (loading) {
    return (
      <div className="page-content">
        Carregando perfil...
      </div>
    );
  }

  if (!aluno) return null;

  return (
    <div className="page-content">
      <header className="profile-top-actions">
        <button
          className="back-button"
          onClick={() =>
            navigate("/alunos")
          }
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <button
          className="btn-primary"
          onClick={() =>
            navigate(`/alunos/${id}/editar`)
          }
        >
          <Pencil size={17} />
          Editar aluno
        </button>
      </header>

      <section className="student-profile-header">
        <div className="profile-avatar">
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={aluno.nome}
            />
          ) : (
            <User size={48} />
          )}
        </div>

        <div className="profile-main-info">
          <div className="profile-name-row">
            <h1>{aluno.nome}</h1>

            <span
              className={`status-badge status-${aluno.status}`}
            >
              {aluno.status}
            </span>
          </div>

          <div className="profile-belt">
            Faixa {aluno.faixa}
            {" • "}
            {aluno.grau}º grau
          </div>

          <div className="profile-meta">
            <span>
              <CalendarDays size={15} />
              Matrícula:{" "}
              {formatarData(
                aluno.data_matricula
              )}
            </span>

            {aluno.telefone && (
              <span>
                <Phone size={15} />
                {aluno.telefone}
              </span>
            )}

            {aluno.email && (
              <span>
                <Mail size={15} />
                {aluno.email}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="profile-summary-grid">
        <div className="profile-summary-card">
          <CreditCard />
          <span>Plano atual</span>
          <strong>
            {matricula?.planos?.nome ||
              "Sem plano"}
          </strong>
        </div>

        <div className="profile-summary-card">
          <ClipboardCheck />
          <span>Presenças registradas</span>
          <strong>{totalPresencas}</strong>
        </div>

        <div className="profile-summary-card">
          <Award />
          <span>Graduação atual</span>
          <strong>
            {aluno.faixa} • {aluno.grau}º
          </strong>
        </div>

        <div className="profile-summary-card">
          <CreditCard />
          <span>Situação financeira</span>
          <strong>
            {possuiPendencia
              ? "Pendente"
              : "Regular"}
          </strong>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={
            aba === "dados"
              ? "active"
              : ""
          }
          onClick={() =>
            setAba("dados")
          }
        >
          <User size={17} />
          Dados
        </button>

        <button
          className={
            aba === "financeiro"
              ? "active"
              : ""
          }
          onClick={() =>
            setAba("financeiro")
          }
        >
          <CreditCard size={17} />
          Financeiro
        </button>

        <button
          className={
            aba === "presencas"
              ? "active"
              : ""
          }
          onClick={() =>
            setAba("presencas")
          }
        >
          <ClipboardCheck size={17} />
          Presenças
        </button>

        <button
          className={
            aba === "graduacoes"
              ? "active"
              : ""
          }
          onClick={() =>
            setAba("graduacoes")
          }
        >
          <Award size={17} />
          Graduações
        </button>
      </div>

      {aba === "dados" && (
        <div className="profile-grid">
          <section className="content-card">
            <div className="form-section-title">
              <h2>Dados pessoais</h2>
            </div>

            <div className="detail-grid">
              <div>
                <span>Nome</span>
                <strong>{aluno.nome}</strong>
              </div>

              <div>
                <span>CPF</span>
                <strong>
                  {aluno.cpf || "-"}
                </strong>
              </div>

              <div>
                <span>Nascimento</span>
                <strong>
                  {formatarData(
                    aluno.data_nascimento
                  )}
                </strong>
              </div>

              <div>
                <span>Telefone</span>
                <strong>
                  {aluno.telefone || "-"}
                </strong>
              </div>

              <div>
                <span>E-mail</span>
                <strong>
                  {aluno.email || "-"}
                </strong>
              </div>
            </div>
          </section>

          <section className="content-card">
            <div className="form-section-title">
              <h2>Endereço</h2>
            </div>

            <div className="address-display">
              <MapPin size={20} />

              <div>
                <strong>
                  {aluno.endereco || "-"}
                  {aluno.numero
                    ? `, ${aluno.numero}`
                    : ""}
                </strong>

                <span>
                  {[
                    aluno.bairro,
                    aluno.cidade,
                    aluno.estado,
                  ]
                    .filter(Boolean)
                    .join(" - ") || "-"}
                </span>

                {aluno.cep && (
                  <span>
                    CEP {aluno.cep}
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="content-card">
            <div className="form-section-title">
              <h2>Responsável</h2>
            </div>

            {aluno.responsaveis ? (
              <div className="detail-grid">
                <div>
                  <span>Nome</span>
                  <strong>
                    {aluno.responsaveis.nome}
                  </strong>
                </div>

                <div>
                  <span>Parentesco</span>
                  <strong>
                    {aluno.responsaveis.parentesco ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>Telefone</span>
                  <strong>
                    {aluno.responsaveis.telefone ||
                      "-"}
                  </strong>
                </div>

                <div>
                  <span>E-mail</span>
                  <strong>
                    {aluno.responsaveis.email ||
                      "-"}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="empty-inline">
                Nenhum responsável cadastrado.
              </p>
            )}
          </section>

          <section className="content-card">
            <div className="form-section-title">
              <h2>Observações</h2>
            </div>

            <p className="profile-observations">
              {aluno.observacoes ||
                "Nenhuma observação registrada."}
            </p>
          </section>
        </div>
      )}

      {aba === "financeiro" && (
        <section className="content-card">
          <div className="form-section-title">
            <h2>Financeiro</h2>

            <p>
              Plano e mensalidades do aluno.
            </p>
          </div>

          <div className="current-plan-box">
            <span>Plano atual</span>

            <strong>
              {matricula?.planos?.nome ||
                "Nenhum plano ativo"}
            </strong>

            {matricula && (
              <small>
                Valor:{" "}
                {formatarMoeda(
                  matricula.valor_mensalidade ??
                    matricula.planos?.valor
                )}
              </small>
            )}
          </div>

          {mensalidades.length === 0 ? (
            <div className="empty-state">
              Nenhuma mensalidade cadastrada.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Referência</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {mensalidades.map(
                    (mensalidade) => (
                      <tr
                        key={
                          mensalidade.id
                        }
                      >
                        <td>
                          {formatarData(
                            mensalidade.referencia
                          )}
                        </td>

                        <td>
                          {formatarData(
                            mensalidade.vencimento
                          )}
                        </td>

                        <td>
                          {formatarMoeda(
                            Number(
                              mensalidade.valor
                            ) -
                              Number(
                                mensalidade.desconto ||
                                  0
                              ) +
                              Number(
                                mensalidade.acrescimo ||
                                  0
                              )
                          )}
                        </td>

                        <td>
                          <span
                            className={`finance-status finance-${mensalidade.status}`}
                          >
                            {
                              mensalidade.status
                            }
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {aba === "presencas" && (
        <section className="content-card">
          <div className="form-section-title">
            <h2>Presenças</h2>

            <p>
              Últimos treinos registrados.
            </p>
          </div>

          {presencas.length === 0 ? (
            <div className="empty-state">
              Nenhuma presença registrada.
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Horário</th>
                    <th>Turma</th>
                    <th>Registro</th>
                  </tr>
                </thead>

                <tbody>
                  {presencas.map(
                    (presenca) => (
                      <tr key={presenca.id}>
                        <td>
                          {formatarData(
                            presenca.data
                          )}
                        </td>

                        <td>
                          {presenca.horario
                            ?.slice(0, 5) ||
                            "-"}
                        </td>

                        <td>
                          {presenca.turmas
                            ?.nome || "-"}
                        </td>

                        <td>
                          {
                            presenca.tipo_registro
                          }
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {aba === "graduacoes" && (
        <section className="content-card">
          <div className="form-section-title">
            <h2>Graduações</h2>

            <p>
              Histórico de evolução do aluno.
            </p>
          </div>

          {graduacoes.length === 0 ? (
            <div className="empty-state">
              Nenhuma graduação registrada.
            </div>
          ) : (
            <div className="graduation-timeline">
              {graduacoes.map(
                (graduacao) => (
                  <div
                    className="graduation-item"
                    key={graduacao.id}
                  >
                    <div className="graduation-marker" />

                    <div>
                      <strong>
                        {
                          graduacao.nova_faixa
                        }{" "}
                        •{" "}
                        {
                          graduacao.novo_grau
                        }
                        º grau
                      </strong>

                      <span>
                        {formatarData(
                          graduacao.data_graduacao
                        )}
                      </span>

                      {graduacao
                        .professores
                        ?.nome && (
                        <small>
                          Professor:{" "}
                          {
                            graduacao
                              .professores
                              .nome
                          }
                        </small>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
