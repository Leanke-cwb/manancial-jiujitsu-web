import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Banknote,
  CheckCircle2,
  Users,
  Award,
  ArrowRight,
} from "lucide-react";

const RELATORIOS = [
  {
    titulo: "Financeiro",
    descricao:
      "Pagamentos recebidos por período, total arrecadado e formas de pagamento.",
    rota: "/relatorios/financeiro",
    icon: Banknote,
  },
  {
    titulo: "Frequência",
    descricao:
      "Presenças registradas por período, turma e aluno.",
    rota: "/relatorios/frequencia",
    icon: CheckCircle2,
  },
  {
    titulo: "Alunos por Turma",
    descricao:
      "Relação dos alunos atualmente vinculados às turmas.",
    rota: "/relatorios/turmas",
    icon: Users,
  },
  {
    titulo: "Graduações",
    descricao:
      "Histórico de mudanças de faixa e grau por período.",
    rota: "/relatorios/graduacoes",
    icon: Award,
  },
];

export default function Relatorios() {
  const navigate = useNavigate();

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Relatórios</h1>
          <p>
            Consulte e exporte informações da academia.
          </p>
        </div>
      </header>

      <div className="reports-grid">
        {RELATORIOS.map((relatorio) => {
          const Icon = relatorio.icon;

          return (
            <button
              key={relatorio.rota}
              className="report-card"
              onClick={() =>
                navigate(relatorio.rota)
              }
            >
              <div>
                <div className="report-card-icon">
                  <Icon size={22} />
                </div>

                <h2>{relatorio.titulo}</h2>

                <p>
                  {relatorio.descricao}
                </p>
              </div>

              <ArrowRight size={20} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
