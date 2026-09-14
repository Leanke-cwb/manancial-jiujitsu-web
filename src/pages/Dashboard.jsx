import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";
import useUsuarioAtual from "../hooks/useUsuarioAtual";

function hojeISO() {
  const data = new Date();
  const offset = data.getTimezoneOffset();

  return new Date(
    data.getTime() -
      offset * 60 * 1000
  )
    .toISOString()
    .split("T")[0];
}

function inicioMesISO() {
  const agora = new Date();
  const data = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    1
  );

  const offset = data.getTimezoneOffset();

  return new Date(
    data.getTime() -
      offset * 60 * 1000
  )
    .toISOString()
    .split("T")[0];
}

function proximoMesISO() {
  const agora = new Date();
  const data = new Date(
    agora.getFullYear(),
    agora.getMonth() + 1,
    1
  );

  const offset = data.getTimezoneOffset();

  return new Date(
    data.getTime() -
      offset * 60 * 1000
  )
    .toISOString()
    .split("T")[0];
}

function inicioMesTimestamp() {
  const agora = new Date();

  return new Date(
    agora.getFullYear(),
    agora.getMonth(),
    1,
    0,
    0,
    0
  ).toISOString();
}

function proximoMesTimestamp() {
  const agora = new Date();

  return new Date(
    agora.getFullYear(),
    agora.getMonth() + 1,
    1,
    0,
    0,
    0
  ).toISOString();
}

function moeda(valor) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

export default function Dashboard() {
  const {
    usuario,
    perfil,
    loading: loadingUsuario,
  } = useUsuarioAtual();

  const [loading, setLoading] =
    useState(true);

  const [dados, setDados] = useState({
    alunos: 0,
    professores: 0,
    turmas: 0,
    presencas: 0,
    pendentes: 0,
    atrasadas: 0,
    receita: 0,
    graduacoes: 0,
  });

  const podeAcademico = [
    "admin",
    "professor",
    "instrutor",
    "recepcao",
  ].includes(perfil);

  const podePresencas = [
    "admin",
    "professor",
    "instrutor",
  ].includes(perfil);

  const podeGraduacoes = [
    "admin",
    "professor",
  ].includes(perfil);

  const podeFinanceiro = [
    "admin",
    "recepcao",
  ].includes(perfil);

  useEffect(() => {
    if (!loadingUsuario) {
      carregar();
    }
  }, [loadingUsuario, perfil]);

  const carregar = async () => {
    if (!perfil) {
      setLoading(false);
      return;
    }

    if (perfil === "aluno") {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const hoje = hojeISO();

      const consultas = [];

      if (podeAcademico) {
        consultas.push(
          supabase
            .from("alunos")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("status", "ativo")
            .then((r) => [
              "alunos",
              r,
            ])
        );

        consultas.push(
          supabase
            .from("professores")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("ativo", true)
            .then((r) => [
              "professores",
              r,
            ])
        );

        consultas.push(
          supabase
            .from("turmas")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("ativo", true)
            .then((r) => [
              "turmas",
              r,
            ])
        );
      }

      if (podePresencas) {
        consultas.push(
          supabase
            .from("presencas")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("data", hoje)
            .then((r) => [
              "presencas",
              r,
            ])
        );
      }

      if (podeFinanceiro) {
        consultas.push(
          supabase
            .from("mensalidades")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("status", "pendente")
            .then((r) => [
              "pendentes",
              r,
            ])
        );

        consultas.push(
          supabase
            .from("mensalidades")
            .select("*", {
              count: "exact",
              head: true,
            })
            .eq("status", "pendente")
            .lt("vencimento", hoje)
            .then((r) => [
              "atrasadas",
              r,
            ])
        );

        consultas.push(
          supabase
            .from("pagamentos")
            .select("valor")
            .gte(
              "data_pagamento",
              inicioMesTimestamp()
            )
            .lt(
              "data_pagamento",
              proximoMesTimestamp()
            )
            .then((r) => [
              "receita",
              r,
            ])
        );
      }

      if (podeGraduacoes) {
        consultas.push(
          supabase
            .from("graduacoes")
            .select("*", {
              count: "exact",
              head: true,
            })
            .gte(
              "data_graduacao",
              inicioMesISO()
            )
            .lt(
              "data_graduacao",
              proximoMesISO()
            )
            .then((r) => [
              "graduacoes",
              r,
            ])
        );
      }

      const resultados =
        await Promise.all(consultas);

      const novo = {
        alunos: 0,
        professores: 0,
        turmas: 0,
        presencas: 0,
        pendentes: 0,
        atrasadas: 0,
        receita: 0,
        graduacoes: 0,
      };

      for (const [
        chave,
        resultado,
      ] of resultados) {
        if (resultado.error) {
          throw resultado.error;
        }

        if (chave === "receita") {
          novo.receita = (
            resultado.data || []
          ).reduce(
            (total, item) =>
              total +
              Number(item.valor || 0),
            0
          );
        } else {
          novo[chave] =
            resultado.count || 0;
        }
      }

      setDados(novo);
    } catch (error) {
      console.error(
        "Erro ao carregar dashboard:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  const saudacao = useMemo(() => {
    const hora =
      new Date().getHours();

    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";

    return "Boa noite";
  }, []);

  if (
    loadingUsuario ||
    loading
  ) {
    return (
      <div className="page-content">
        <div className="dashboard-loading">
          Carregando indicadores...
        </div>
      </div>
    );
  }

  if (perfil === "aluno") {
    return (
      <div className="page-content">
        <header className="page-header">
          <div>
            <h1>
              {saudacao},{" "}
              {usuario?.nome
                ?.split(" ")[0] ||
                "Aluno"}
            </h1>

            <p>
              Bem-vindo ao Manancial
              Jiu Jitsu.
            </p>
          </div>
        </header>

        <div className="student-portal-message">
          <ShieldCheck size={34} />

          <h2>
            Portal do aluno
          </h2>

          <p>
            Seu acesso está ativo. O portal
            individual do aluno será
            disponibilizado em uma próxima
            etapa.
          </p>
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
            {usuario?.nome
              ? `, ${
                  usuario.nome.split(
                    " "
                  )[0]
                }`
              : ""}
          </h1>

          <p>
            Visão geral conforme seu perfil
            de acesso.
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
        {podeAcademico && (
          <>
            <div className="dashboard-real-card">
              <Users size={22} />
              <span>Alunos ativos</span>
              <strong>{dados.alunos}</strong>
            </div>

            <div className="dashboard-real-card">
              <UserRoundCheck size={22} />
              <span>Professores ativos</span>
              <strong>
                {dados.professores}
              </strong>
            </div>

            <div className="dashboard-real-card">
              <GraduationCap size={22} />
              <span>Turmas ativas</span>
              <strong>{dados.turmas}</strong>
            </div>
          </>
        )}

        {podePresencas && (
          <div className="dashboard-real-card">
            <CheckCircle2 size={22} />
            <span>Presenças hoje</span>
            <strong>
              {dados.presencas}
            </strong>
          </div>
        )}

        {podeFinanceiro && (
          <>
            <div className="dashboard-real-card">
              <WalletCards size={22} />
              <span>
                Mensalidades pendentes
              </span>
              <strong>
                {dados.pendentes}
              </strong>
            </div>

            <div className="dashboard-real-card dashboard-alert-card">
              <TriangleAlert size={22} />
              <span>
                Mensalidades atrasadas
              </span>
              <strong>
                {dados.atrasadas}
              </strong>
            </div>

            <div className="dashboard-real-card">
              <Banknote size={22} />
              <span>Receita do mês</span>
              <strong className="dashboard-money-value">
                {moeda(dados.receita)}
              </strong>
            </div>
          </>
        )}

        {podeGraduacoes && (
          <div className="dashboard-real-card">
            <Award size={22} />
            <span>
              Graduações do mês
            </span>
            <strong>
              {dados.graduacoes}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}
