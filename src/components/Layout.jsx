import React from "react";

import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  UserRoundCheck,
  GraduationCap,
  CheckCircle2,
  Award,
  WalletCards,
  FileBarChart,
  Settings,
  LogOut,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";
import useUsuarioAtual from "../hooks/useUsuarioAtual";
import AcademyBrand from "./AcademyBrand";

const MENU = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    perfis: [
      "admin",
      "professor",
      "instrutor",
      "recepcao",
      "aluno",
    ],
  },
  {
    to: "/alunos",
    label: "Alunos",
    icon: Users,
    perfis: [
      "admin",
      "professor",
      "instrutor",
      "recepcao",
    ],
  },
  {
    to: "/professores",
    label: "Professores",
    icon: UserRoundCheck,
    perfis: ["admin"],
  },
  {
    to: "/turmas",
    label: "Turmas",
    icon: GraduationCap,
    perfis: [
      "admin",
      "professor",
    ],
  },
  {
    to: "/presencas",
    label: "Presenças",
    icon: CheckCircle2,
    perfis: [
      "admin",
      "professor",
      "instrutor",
    ],
  },
  {
    to: "/graduacoes",
    label: "Graduações",
    icon: Award,
    perfis: [
      "admin",
      "professor",
    ],
  },
  {
    to: "/financeiro",
    label: "Financeiro",
    icon: WalletCards,
    perfis: [
      "admin",
      "recepcao",
    ],
  },
  {
    to: "/relatorios",
    label: "Relatórios",
    icon: FileBarChart,
    perfis: [
      "admin",
      "professor",
      "instrutor",
      "recepcao",
    ],
  },
  {
    to: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    perfis: ["admin"],
  },
];

export default function Layout() {
  const navigate = useNavigate();

  const {
    usuario,
    loading,
  } = useUsuarioAtual();

  const sair = async () => {
    await supabase.auth.signOut();

    navigate("/");
  };

  if (loading) {
    return (
      <div className="loading-page">
        Carregando...
      </div>
    );
  }

  const perfil = usuario?.perfil || "";

  const itens = MENU.filter(
    (item) =>
      item.perfis.includes(perfil)
  );

  return (
    <div className="app-layout">

      <aside className="sidebar">

        <div>

          <div className="sidebar-header">
            <AcademyBrand variant="sidebar" />
          </div>

          <nav className="sidebar-nav">

            {itens.map((item) => {

              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `sidebar-link ${
                      isActive
                        ? "menu-active"
                        : ""
                    }`
                  }
                >
                  <Icon size={19} />

                  <span>
                    {item.label}
                  </span>

                </NavLink>
              );

            })}

          </nav>

        </div>

        <div className="sidebar-user-area">

          <div className="sidebar-user-info">

            <strong>
              {usuario?.nome || "Usuário"}
            </strong>

            <span>
              {perfil || "-"}
            </span>

          </div>

          <button
            className="logout-button"
            onClick={sair}
          >
            <LogOut size={19} />

            <span>
              Sair
            </span>

          </button>

        </div>

      </aside>

      <main className="main-area">
        <Outlet />
      </main>

    </div>
  );
}