import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  WalletCards,
  AlertTriangle,
  CircleDollarSign,
  ArrowRight,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

export default function Financeiro() {
  const navigate = useNavigate();

  const [dados, setDados] = useState({
    planosAtivos: 0,
    mensalidadesPendentes: 0,
    mensalidadesAtrasadas: 0,
    receitaMes: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarResumo();
  }, []);

  const carregarResumo = async () => {
    try {
      setLoading(true);

      const { count: planosAtivos, error: erroPlanos } =
        await supabase
          .from("planos")
          .select("*", { count: "exact", head: true })
          .eq("ativo", true);

      if (erroPlanos) throw erroPlanos;

      const {
        count: mensalidadesPendentes,
        error: erroPendentes,
      } = await supabase
        .from("mensalidades")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");

      if (erroPendentes) throw erroPendentes;

      const hoje = new Date().toISOString().split("T")[0];

      const {
        count: mensalidadesAtrasadas,
        error: erroAtrasadas,
      } = await supabase
        .from("mensalidades")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente")
        .lt("vencimento", hoje);

      if (erroAtrasadas) throw erroAtrasadas;

      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      const { data: pagamentos, error: erroPagamentos } =
        await supabase
          .from("pagamentos")
          .select("valor")
          .gte("data_pagamento", inicioMes.toISOString());

      if (erroPagamentos) throw erroPagamentos;

      const receitaMes =
        pagamentos?.reduce(
          (total, pagamento) =>
            total + Number(pagamento.valor || 0),
          0
        ) || 0;

      setDados({
        planosAtivos: planosAtivos || 0,
        mensalidadesPendentes: mensalidadesPendentes || 0,
        mensalidadesAtrasadas: mensalidadesAtrasadas || 0,
        receitaMes,
      });
    } catch (error) {
      console.error("Erro ao carregar financeiro:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatarMoeda = (valor) =>
    Number(valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const modulos = [
    {
      titulo: "Planos",
      descricao:
        "Cadastre e configure os planos oferecidos pela academia.",
      icon: WalletCards,
      rota: "/financeiro/planos",
    },
    {
      titulo: "Mensalidades",
      descricao:
        "Gere e acompanhe as cobranças dos alunos.",
      icon: CreditCard,
      rota: "/financeiro/mensalidades",
    },
    {
      titulo: "Pagamentos",
      descricao:
        "Consulte recebimentos e emita recibos.",
      icon: CircleDollarSign,
      rota: "/financeiro/pagamentos",
    },
    {
      titulo: "Inadimplentes",
      descricao:
        "Acompanhe mensalidades vencidas e ainda não pagas.",
      icon: AlertTriangle,
      rota: "/financeiro/inadimplentes",
    },
  ];

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Financeiro</h1>
          <p>
            Gestão de planos, mensalidades, pagamentos e inadimplência.
          </p>
        </div>
      </header>

      {loading ? (
        <section className="content-card">
          Carregando financeiro...
        </section>
      ) : (
        <>
          <div className="finance-summary-grid">
            <div className="finance-summary-card">
              <div className="finance-summary-icon">
                <WalletCards size={22} />
              </div>
              <span>Planos ativos</span>
              <strong>{dados.planosAtivos}</strong>
            </div>

            <div className="finance-summary-card">
              <div className="finance-summary-icon">
                <CreditCard size={22} />
              </div>
              <span>Mensalidades pendentes</span>
              <strong>{dados.mensalidadesPendentes}</strong>
            </div>

            <div className="finance-summary-card">
              <div className="finance-summary-icon">
                <AlertTriangle size={22} />
              </div>
              <span>Mensalidades atrasadas</span>
              <strong>{dados.mensalidadesAtrasadas}</strong>
            </div>

            <div className="finance-summary-card">
              <div className="finance-summary-icon">
                <CircleDollarSign size={22} />
              </div>
              <span>Receita do mês</span>
              <strong>{formatarMoeda(dados.receitaMes)}</strong>
            </div>
          </div>

          <div className="finance-modules-grid">
            {modulos.map((modulo) => {
              const Icon = modulo.icon;

              return (
                <button
                  key={modulo.rota}
                  className="finance-module-card"
                  onClick={() => navigate(modulo.rota)}
                >
                  <div>
                    <Icon size={26} />
                    <h2>{modulo.titulo}</h2>
                    <p>{modulo.descricao}</p>
                  </div>

                  <ArrowRight size={20} />
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
