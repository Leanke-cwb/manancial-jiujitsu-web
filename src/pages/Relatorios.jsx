import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  CheckCircle2,
  Users,
  Award,
  ArrowRight,
} from "lucide-react";

import useUsuarioAtual from "../hooks/useUsuarioAtual";

const RELATORIOS = [
  {
    titulo: "Financeiro",
    descricao:
      "Pagamentos recebidos por período, total arrecadado e formas de pagamento.",
    rota: "/relatorios/financeiro",
    icon: Banknote,
    perfis: ["admin", "recepcao"],
  },
  {
    titulo: "Frequência",
    descricao:
      "Presenças registradas por período, turma e aluno.",
    rota: "/relatorios/frequencia",
    icon: CheckCircle2,
    perfis: [
      "admin",
      "professor",
      "instrutor",
    ],
  },
  {
    titulo: "Alunos por Turma",
    descricao:
      "Relação dos alunos atualmente vinculados às turmas.",
    rota: "/relatorios/turmas",
    icon: Users,
    perfis: [
      "admin",
      "professor",
      "instrutor",
    ],
  },
  {
    titulo: "Graduações",
    descricao:
      "Histórico de mudanças de faixa e grau por período.",
    rota: "/relatorios/graduacoes",
    icon: Award,
    perfis: [
      "admin",
      "professor",
    ],
  },
];

export default function Relatorios() {
  const navigate = useNavigate();

  const {
    perfil,
    loading,
  } = useUsuarioAtual();

  if (loading) {
    return (
      <div className="page-content">
        Carregando relatórios...
      </div>
    );
  }

  const relatoriosPermitidos =
    RELATORIOS.filter((item) =>
      item.perfis.includes(perfil)
    );

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Relatórios</h1>

          <p>
            Consulte e exporte as informações
            permitidas para o seu perfil.
          </p>
        </div>
      </header>

      {relatoriosPermitidos.length ===
      0 ? (
        <div className="empty-state">
          Seu perfil não possui relatórios
          disponíveis.
        </div>
      ) : (
        <div className="reports-grid">
          {relatoriosPermitidos.map(
            (relatorio) => {
              const Icon =
                relatorio.icon;

              return (
                <button
                  key={relatorio.rota}
                  className="report-card"
                  onClick={() =>
                    navigate(
                      relatorio.rota
                    )
                  }
                >
                  <div>
                    <div className="report-card-icon">
                      <Icon size={22} />
                    </div>

                    <h2>
                      {relatorio.titulo}
                    </h2>

                    <p>
                      {
                        relatorio.descricao
                      }
                    </p>
                  </div>

                  <ArrowRight
                    size={20}
                  />
                </button>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}
