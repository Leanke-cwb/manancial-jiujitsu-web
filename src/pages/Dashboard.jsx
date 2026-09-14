import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserRoundCheck,
  GraduationCap,
  CheckCircle2,
  WalletCards,
  TriangleAlert,
  Banknote,
  Award,
  CalendarDays,
  Clock3,
  ReceiptText,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

function dataLocalISO(data = new Date()) {
  const offset = data.getTimezoneOffset();

  return new Date(
    data.getTime() - offset * 60 * 1000
  )
    .toISOString()
    .split("T")[0];
}

function inicioMesISO() {
  const agora = new Date();

  return dataLocalISO(
    new Date(
      agora.getFullYear(),
      agora.getMonth(),
      1
    )
  );
}

function inicioProximoMesISO() {
  const agora = new Date();

  return dataLocalISO(
    new Date(
      agora.getFullYear(),
      agora.getMonth() + 1,
      1
    )
  );
}

function inicioMesTimestamp() {
  const agora = new Date();

  return new Date(
    agora.getFullYear(),
    agora.getMonth(),
    1,
    0,
    0,
    0,
    0
  ).toISOString();
}

function inicioProximoMesTimestamp() {
  const agora = new Date();

  return new Date(
    agora.getFullYear(),
    agora.getMonth() + 1,
    1,
    0,
    0,
    0,
    0
  ).toISOString();
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

function formatarData(data) {
  if (!data) return "-";

  return new Date(
    `${data}T12:00:00`
  ).toLocaleDateString("pt-BR");
}

function formatarDataHora(data) {
  if (!data) return "-";

  return new Date(data).toLocaleString(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  );
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] =
    useState("");

  const [indicadores, setIndicadores] =
    useState({
      alunosAtivos: 0,
      professoresAtivos: 0,
      turmasAtivas: 0,
      presencasHoje: 0,
      mensalidadesPendentes: 0,
      mensalidadesAtrasadas: 0,
      receitaMes: 0,
      graduacoesMes: 0,
    });

  const [ultimosPagamentos, setUltimosPagamentos] =
    useState([]);

  const [
    proximasMensalidades,
    setProximasMensalidades,
  ] = useState([]);

  const [ultimasPresencas, setUltimasPresencas] =
    useState([]);

  const [ultimasGraduacoes, setUltimasGraduacoes] =
    useState([]);

  useEffect(() => {
    carregarDashboard();
  }, []);

  const carregarDashboard = async () => {
    try {
      setLoading(true);

      const hoje = dataLocalISO();
      const inicioMes = inicioMesISO();
      const proximoMes = inicioProximoMesISO();

      const inicioMesTs =
        inicioMesTimestamp();

      const proximoMesTs =
        inicioProximoMesTimestamp();

      const {
        data: authData,
      } = await supabase.auth.getUser();

      const authUserId =
        authData?.user?.id || null;

      const consultas = await Promise.all([
        supabase
          .from("alunos")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("status", "ativo"),

        supabase
          .from("professores")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("ativo", true),

        supabase
          .from("turmas")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("ativo", true),

        supabase
          .from("presencas")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("data", hoje),

        supabase
          .from("mensalidades")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("status", "pendente"),

        supabase
          .from("mensalidades")
          .select("*", {
            count: "exact",
            head: true,
          })
          .eq("status", "pendente")
          .lt("vencimento", hoje),

        supabase
          .from("pagamentos")
          .select("valor")
          .gte(
            "data_pagamento",
            inicioMesTs
          )
          .lt(
            "data_pagamento",
            proximoMesTs
          ),

        supabase
          .from("graduacoes")
          .select("*", {
            count: "exact",
            head: true,
          })
          .gte(
            "data_graduacao",
            inicioMes
          )
          .lt(
            "data_graduacao",
            proximoMes
          ),

        supabase
          .from("pagamentos")
          .select(`
            id,
            valor,
            forma_pagamento,
            data_pagamento,
            alunos (
              id,
              nome
            )
          `)
          .order(
            "data_pagamento",
            { ascending: false }
          )
          .limit(5),

        supabase
          .from("mensalidades")
          .select(`
            id,
            vencimento,
            valor,
            desconto,
            acrescimo,
            status,
            alunos (
              id,
              nome
            )
          `)
          .eq("status", "pendente")
          .gte("vencimento", hoje)
          .order(
            "vencimento",
            { ascending: true }
          )
          .limit(5),

        supabase
          .from("presencas")
          .select(`
            id,
            data,
            horario,
            alunos (
              id,
              nome
            ),
            turmas (
              id,
              nome
            )
          `)
          .order(
            "data",
            { ascending: false }
          )
          .order(
            "horario",
            { ascending: false }
          )
          .limit(5),

        supabase
          .from("graduacoes")
          .select(`
            id,
            data_graduacao,
            nova_faixa,
            novo_grau,
            alunos (
              id,
              nome
            ),
            professores (
              id,
              nome
            )
          `)
          .order(
            "data_graduacao",
            { ascending: false }
          )
          .order(
            "created_at",
            { ascending: false }
          )
          .limit(5),
      ]);

      const erro = consultas.find(
        (resultado) =>
          resultado?.error
      )?.error;

      if (erro) throw erro;

      const [
        alunosRes,
        professoresRes,
        turmasRes,
        presencasRes,
        pendentesRes,
        atrasadasRes,
        receitaRes,
        graduacoesRes,
        pagamentosRes,
        proximasRes,
        ultimasPresencasRes,
        ultimasGraduacoesRes,
      ] = consultas;

      const receitaMes = (
        receitaRes.data || []
      ).reduce(
        (total, pagamento) =>
          total +
          Number(
            pagamento.valor || 0
          ),
        0
      );

      setIndicadores({
        alunosAtivos:
          alunosRes.count || 0,
        professoresAtivos:
          professoresRes.count || 0,
        turmasAtivas:
          turmasRes.count || 0,
        presencasHoje:
          presencasRes.count || 0,
        mensalidadesPendentes:
          pendentesRes.count || 0,
        mensalidadesAtrasadas:
          atrasadasRes.count || 0,
        receitaMes,
        graduacoesMes:
          graduacoesRes.count || 0,
      });

      setUltimosPagamentos(
        pagamentosRes.data || []
      );

      setProximasMensalidades(
        proximasRes.data || []
      );

      setUltimasPresencas(
        ultimasPresencasRes.data || []
      );

      setUltimasGraduacoes(
        ultimasGraduacoesRes.data || []
      );

      if (authUserId) {
        const {
          data: usuario,
          error: erroUsuario,
        } = await supabase
          .from("usuarios")
          .select("nome")
          .eq("user_id", authUserId)
          .maybeSingle();

        if (!erroUsuario) {
          setNomeUsuario(
            usuario?.nome || ""
          );
        }
      }
    } catch (error) {
      console.error(
        "Erro ao carregar dashboard:",
        error
      );

      alert(
        `Erro ao carregar dashboard: ${
          error.message ||
          "erro desconhecido"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const saudacao = useMemo(() => {
    const hora = new Date().getHours();

    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";

    return "Boa noite";
  }, []);

  const primeiroNome =
    nomeUsuario?.trim().split(" ")[0];

  if (loading) {
    return (
      <div className="page-content">
        <div className="dashboard-loading">
          Carregando indicadores...
        </div>
      </div>
    );
  }

  return (
    <div className="page-content">
      <header className="page-header dashboard-real-header">
        <div>
          <h1>
            {saudacao}
            {primeiroNome
              ? `, ${primeiroNome}`
              : ""}
          </h1>

          <p>
            Visão geral da academia Manancial
            Jiu Jitsu.
          </p>
        </div>

        <div className="dashboard-date">
          <CalendarDays size={18} />

          <span>
            {new Date().toLocaleDateString(
              "pt-BR",
              {
                weekday: "long",
                day: "2-digit",
                month: "long",
              }
            )}
          </span>
        </div>
      </header>

      <div className="dashboard-real-grid">
        <div className="dashboard-real-card">
          <Users size={22} />

          <span>Alunos ativos</span>

          <strong>
            {indicadores.alunosAtivos}
          </strong>
        </div>

        <div className="dashboard-real-card">
          <UserRoundCheck size={22} />

          <span>Professores ativos</span>

          <strong>
            {indicadores.professoresAtivos}
          </strong>
        </div>

        <div className="dashboard-real-card">
          <GraduationCap size={22} />

          <span>Turmas ativas</span>

          <strong>
            {indicadores.turmasAtivas}
          </strong>
        </div>

        <div className="dashboard-real-card">
          <CheckCircle2 size={22} />

          <span>Presenças hoje</span>

          <strong>
            {indicadores.presencasHoje}
          </strong>
        </div>

        <div className="dashboard-real-card">
          <WalletCards size={22} />

          <span>Mensalidades pendentes</span>

          <strong>
            {
              indicadores.mensalidadesPendentes
            }
          </strong>
        </div>

        <div className="dashboard-real-card dashboard-alert-card">
          <TriangleAlert size={22} />

          <span>Mensalidades atrasadas</span>

          <strong>
            {
              indicadores.mensalidadesAtrasadas
            }
          </strong>
        </div>

        <div className="dashboard-real-card">
          <Banknote size={22} />

          <span>Receita do mês</span>

          <strong className="dashboard-money-value">
            {formatarMoeda(
              indicadores.receitaMes
            )}
          </strong>
        </div>

        <div className="dashboard-real-card">
          <Award size={22} />

          <span>Graduações do mês</span>

          <strong>
            {indicadores.graduacoesMes}
          </strong>
        </div>
      </div>

      <div className="dashboard-sections-grid">
        <section className="content-card dashboard-section-card">
          <div className="dashboard-section-title">
            <div>
              <ReceiptText size={18} />

              <h2>Últimos pagamentos</h2>
            </div>

            <span>
              Movimentações mais recentes
            </span>
          </div>

          {ultimosPagamentos.length === 0 ? (
            <div className="dashboard-empty">
              Nenhum pagamento registrado.
            </div>
          ) : (
            <div className="dashboard-list">
              {ultimosPagamentos.map(
                (pagamento) => (
                  <div
                    className="dashboard-list-row"
                    key={pagamento.id}
                  >
                    <div>
                      <strong>
                        {pagamento.alunos
                          ?.nome || "-"}
                      </strong>

                      <span>
                        {pagamento.forma_pagamento ||
                          "Não informado"}
                        {" • "}
                        {formatarDataHora(
                          pagamento.data_pagamento
                        )}
                      </span>
                    </div>

                    <strong className="dashboard-positive">
                      {formatarMoeda(
                        pagamento.valor
                      )}
                    </strong>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="content-card dashboard-section-card">
          <div className="dashboard-section-title">
            <div>
              <WalletCards size={18} />

              <h2>Próximas mensalidades</h2>
            </div>

            <span>
              Próximos vencimentos
            </span>
          </div>

          {proximasMensalidades.length === 0 ? (
            <div className="dashboard-empty">
              Nenhuma mensalidade pendente
              futura.
            </div>
          ) : (
            <div className="dashboard-list">
              {proximasMensalidades.map(
                (mensalidade) => {
                  const total =
                    Number(
                      mensalidade.valor || 0
                    ) -
                    Number(
                      mensalidade.desconto ||
                        0
                    ) +
                    Number(
                      mensalidade.acrescimo ||
                        0
                    );

                  return (
                    <div
                      className="dashboard-list-row"
                      key={mensalidade.id}
                    >
                      <div>
                        <strong>
                          {mensalidade.alunos
                            ?.nome || "-"}
                        </strong>

                        <span>
                          Vence em{" "}
                          {formatarData(
                            mensalidade.vencimento
                          )}
                        </span>
                      </div>

                      <strong>
                        {formatarMoeda(total)}
                      </strong>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section className="content-card dashboard-section-card">
          <div className="dashboard-section-title">
            <div>
              <Clock3 size={18} />

              <h2>Últimas presenças</h2>
            </div>

            <span>
              Registros de frequência
            </span>
          </div>

          {ultimasPresencas.length === 0 ? (
            <div className="dashboard-empty">
              Nenhuma presença registrada.
            </div>
          ) : (
            <div className="dashboard-list">
              {ultimasPresencas.map(
                (presenca) => (
                  <div
                    className="dashboard-list-row"
                    key={presenca.id}
                  >
                    <div>
                      <strong>
                        {presenca.alunos
                          ?.nome || "-"}
                      </strong>

                      <span>
                        {presenca.turmas
                          ?.nome || "-"}
                      </span>
                    </div>

                    <div className="dashboard-list-meta">
                      <strong>
                        {formatarData(
                          presenca.data
                        )}
                      </strong>

                      <span>
                        {presenca.horario
                          ?.slice(0, 5) ||
                          "-"}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        <section className="content-card dashboard-section-card">
          <div className="dashboard-section-title">
            <div>
              <Award size={18} />

              <h2>Últimas graduações</h2>
            </div>

            <span>
              Evolução dos alunos
            </span>
          </div>

          {ultimasGraduacoes.length === 0 ? (
            <div className="dashboard-empty">
              Nenhuma graduação registrada.
            </div>
          ) : (
            <div className="dashboard-list">
              {ultimasGraduacoes.map(
                (graduacao) => (
                  <div
                    className="dashboard-list-row"
                    key={graduacao.id}
                  >
                    <div>
                      <strong>
                        {graduacao.alunos
                          ?.nome || "-"}
                      </strong>

                      <span>
                        {graduacao.professores
                          ?.nome ||
                          "Professor não informado"}
                      </span>
                    </div>

                    <div className="dashboard-list-meta">
                      <strong>
                        {
                          graduacao.nova_faixa
                        }
                        {" • "}
                        {graduacao.novo_grau ??
                          0}
                        º
                      </strong>

                      <span>
                        {formatarData(
                          graduacao.data_graduacao
                        )}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
