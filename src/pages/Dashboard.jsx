import React, { useEffect, useState } from "react";

import {
  Users,
  CreditCard,
  ClipboardCheck,
  Award,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

export default function Dashboard() {
  const [usuario, setUsuario] = useState(null);

  const [dados, setDados] = useState({
    alunos: 0,
    receita: 0,
    presencas: 0,
    graduacoes: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDashboard();
  }, []);

  const carregarDashboard = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: usuarioData } = await supabase
          .from("usuarios")
          .select("nome, email, perfil")
          .eq("user_id", user.id)
          .maybeSingle();

        setUsuario(usuarioData);
      }

      const { count: alunos } = await supabase
        .from("alunos")
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq("status", "ativo");

      const primeiroDiaMes = new Date();

      primeiroDiaMes.setDate(1);
      primeiroDiaMes.setHours(0, 0, 0, 0);

      const { data: pagamentos } = await supabase
        .from("pagamentos")
        .select("valor")
        .gte(
          "data_pagamento",
          primeiroDiaMes.toISOString()
        );

      const receita =
        pagamentos?.reduce(
          (total, pagamento) =>
            total + Number(pagamento.valor || 0),
          0
        ) || 0;

      const dataInicioMes = primeiroDiaMes
        .toISOString()
        .split("T")[0];

      const { count: presencas } = await supabase
        .from("presencas")
        .select("*", {
          count: "exact",
          head: true,
        })
        .gte("data", dataInicioMes);

      const { count: graduacoes } = await supabase
        .from("graduacoes")
        .select("*", {
          count: "exact",
          head: true,
        })
        .gte("data_graduacao", dataInicioMes);

      setDados({
        alunos: alunos || 0,
        receita,
        presencas: presencas || 0,
        graduacoes: graduacoes || 0,
      });
    } catch (error) {
      console.error(
        "Erro ao carregar dashboard:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        Carregando dashboard...
      </div>
    );
  }

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>

          <p>
            Bem-vindo
            {usuario?.nome
              ? `, ${usuario.nome}`
              : ""}
            .
          </p>
        </div>

        <div className="user-info">
          <strong>{usuario?.nome}</strong>

          <span>{usuario?.perfil}</span>
        </div>
      </header>

      <div className="dashboard-cards">
        <div className="stat-card">
          <Users />

          <div>
            <span>Alunos ativos</span>
            <strong>{dados.alunos}</strong>
          </div>
        </div>

        <div className="stat-card">
          <CreditCard />

          <div>
            <span>Receita do mês</span>

            <strong>
              {dados.receita.toLocaleString(
                "pt-BR",
                {
                  style: "currency",
                  currency: "BRL",
                }
              )}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <ClipboardCheck />

          <div>
            <span>Presenças no mês</span>
            <strong>{dados.presencas}</strong>
          </div>
        </div>

        <div className="stat-card">
          <Award />

          <div>
            <span>Graduações no mês</span>
            <strong>{dados.graduacoes}</strong>
          </div>
        </div>
      </div>

      <section className="welcome-card">
        <h2>Manancial Jiu Jitsu</h2>

        <p>
          Sistema de gestão da academia.
        </p>

        <div className="connection-success">
          ✓ Sistema conectado
        </div>
      </section>
    </div>
  );
}