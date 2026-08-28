import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  UserRound,
  CalendarDays,
  ClipboardCheck,
  Award,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Erro ao sair:", error);
      return;
    }

    navigate("/");
  };

  const itens = [
    {
      nome: "Dashboard",
      rota: "/dashboard",
      icone: LayoutDashboard,
    },
    {
      nome: "Alunos",
      rota: "/alunos",
      icone: Users,
    },
    {
      nome: "Professores",
      rota: "/professores",
      icone: UserRound,
    },
    {
      nome: "Turmas",
      rota: "/turmas",
      icone: CalendarDays,
    },
    {
      nome: "Presenças",
      rota: "/presencas",
      icone: ClipboardCheck,
    },
    {
      nome: "Graduações",
      rota: "/graduacoes",
      icone: Award,
    },
    {
      nome: "Financeiro",
      rota: "/financeiro",
      icone: CreditCard,
    },
    {
      nome: "Relatórios",
      rota: "/relatorios",
      icone: BarChart3,
    },
    {
      nome: "Configurações",
      rota: "/configuracoes",
      icone: Settings,
    },
  ];

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-logo">
          <strong>MANANCIAL</strong>
          <span>JIU JITSU</span>
        </div>

        <nav className="sidebar-nav">
          {itens.map((item) => {
            const Icone = item.icone;

            return (
              <NavLink
                key={item.rota}
                to={item.rota}
                className={({ isActive }) =>
                  `sidebar-link ${
                    isActive ? "menu-active" : ""
                  }`
                }
              >
                <Icone size={19} />
                <span>{item.nome}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <button
        className="logout-button"
        onClick={handleLogout}
      >
        <LogOut size={19} />
        <span>Sair</span>
      </button>
    </aside>
  );
}