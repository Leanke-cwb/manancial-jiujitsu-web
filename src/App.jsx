import React from "react";

import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import AtivarConta from "./pages/AtivarConta";
import Dashboard from "./pages/Dashboard";

import Alunos from "./pages/Alunos";
import CadastrarAluno from "./pages/CadastrarAluno";
import EditarAluno from "./pages/EditarAluno";
import PerfilAluno from "./pages/PerfilAluno";
import MatricularAluno from "./pages/MatricularAluno";

import Professores from "./pages/Professores";
import CadastrarProfessor from "./pages/CadastrarProfessor";
import EditarProfessor from "./pages/EditarProfessor";

import Turmas from "./pages/Turmas";
import CadastrarTurma from "./pages/CadastrarTurma";
import EditarTurma from "./pages/EditarTurma";
import TurmaAlunos from "./pages/TurmaAlunos";

import Presencas from "./pages/Presencas";

import Graduacoes from "./pages/Graduacoes";
import NovaGraduacao from "./pages/NovaGraduacao";

import Financeiro from "./pages/Financeiro";
import Planos from "./pages/Planos";
import NovoPlano from "./pages/NovoPlano";
import EditarPlano from "./pages/EditarPlano";
import Mensalidades from "./pages/Mensalidades";
import RegistrarPagamento from "./pages/RegistrarPagamento";
import Pagamentos from "./pages/Pagamentos";
import Inadimplentes from "./pages/Inadimplentes";
import ReciboPagamento from "./pages/ReciboPagamento";

import Relatorios from "./pages/Relatorios";
import RelatorioFinanceiro from "./pages/RelatorioFinanceiro";
import RelatorioFrequencia from "./pages/RelatorioFrequencia";
import RelatorioTurmas from "./pages/RelatorioTurmas";
import RelatorioGraduacoes from "./pages/RelatorioGraduacoes";

import Configuracoes from "./pages/Configuracoes";
import Usuarios from "./pages/Usuarios";
import NovoUsuario from "./pages/NovoUsuario";
import EditarUsuario from "./pages/EditarUsuario";

import AcessoNegado from "./pages/AcessoNegado";

import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import Layout from "./components/Layout";

import ConfiguracoesAcademia from "./pages/ConfiguracoesAcademia";

const ADMIN = ["admin"];

const ACADEMICO = [
  "admin",
  "professor",
  "instrutor",
  "recepcao",
];

const EDITAR_ALUNO = [
  "admin",
  "recepcao",
];

const TURMAS = [
  "admin",
  "professor",
];

const PRESENCAS = [
  "admin",
  "professor",
  "instrutor",
];

const GRADUACOES = [
  "admin",
  "professor",
];

const FINANCEIRO = [
  "admin",
  "recepcao",
];

const RELATORIOS = [
  "admin",
  "professor",
  "instrutor",
  "recepcao",
];

function ComPerfil({
  allowed,
  children,
}) {
  return (
    <RoleRoute allowed={allowed}>
      {children}
    </RoleRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/ativar-conta"
        element={<AtivarConta />}
      />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={<Dashboard />}
        />

        <Route
          path="/acesso-negado"
          element={<AcessoNegado />}
        />

        <Route
          path="/alunos"
          element={
            <ComPerfil allowed={ACADEMICO}>
              <Alunos />
            </ComPerfil>
          }
        />

        <Route
          path="/alunos/novo"
          element={
            <ComPerfil
              allowed={EDITAR_ALUNO}
            >
              <CadastrarAluno />
            </ComPerfil>
          }
        />

        <Route
          path="/alunos/:id/editar"
          element={
            <ComPerfil
              allowed={EDITAR_ALUNO}
            >
              <EditarAluno />
            </ComPerfil>
          }
        />

        <Route
          path="/alunos/:id/matricular"
          element={
            <ComPerfil
              allowed={EDITAR_ALUNO}
            >
              <MatricularAluno />
            </ComPerfil>
          }
        />

        <Route
          path="/alunos/:id"
          element={
            <ComPerfil allowed={ACADEMICO}>
              <PerfilAluno />
            </ComPerfil>
          }
        />

        <Route
          path="/professores"
          element={
            <ComPerfil allowed={ADMIN}>
              <Professores />
            </ComPerfil>
          }
        />

        <Route
          path="/professores/novo"
          element={
            <ComPerfil allowed={ADMIN}>
              <CadastrarProfessor />
            </ComPerfil>
          }
        />

        <Route
          path="/professores/:id/editar"
          element={
            <ComPerfil allowed={ADMIN}>
              <EditarProfessor />
            </ComPerfil>
          }
        />

        <Route
          path="/turmas"
          element={
            <ComPerfil allowed={TURMAS}>
              <Turmas />
            </ComPerfil>
          }
        />

        <Route
          path="/turmas/nova"
          element={
            <ComPerfil allowed={TURMAS}>
              <CadastrarTurma />
            </ComPerfil>
          }
        />

        <Route
          path="/turmas/:id/editar"
          element={
            <ComPerfil allowed={TURMAS}>
              <EditarTurma />
            </ComPerfil>
          }
        />

        <Route
          path="/turmas/:id/alunos"
          element={
            <ComPerfil allowed={TURMAS}>
              <TurmaAlunos />
            </ComPerfil>
          }
        />

        <Route
          path="/presencas"
          element={
            <ComPerfil allowed={PRESENCAS}>
              <Presencas />
            </ComPerfil>
          }
        />

        <Route
          path="/graduacoes"
          element={
            <ComPerfil
              allowed={GRADUACOES}
            >
              <Graduacoes />
            </ComPerfil>
          }
        />

        <Route
          path="/graduacoes/nova"
          element={
            <ComPerfil
              allowed={GRADUACOES}
            >
              <NovaGraduacao />
            </ComPerfil>
          }
        />

        <Route
          path="/financeiro"
          element={
            <ComPerfil
              allowed={FINANCEIRO}
            >
              <Financeiro />
            </ComPerfil>
          }
        />

        <Route
          path="/financeiro/planos"
          element={
            <ComPerfil
              allowed={FINANCEIRO}
            >
              <Planos />
            </ComPerfil>
          }
        />

        <Route
          path="/financeiro/planos/novo"
          element={
            <ComPerfil
              allowed={FINANCEIRO}
            >
              <NovoPlano />
            </ComPerfil>
          }
        />

        <Route
          path="/financeiro/planos/:id/editar"
          element={
            <ComPerfil
              allowed={FINANCEIRO}
            >
              <EditarPlano />
            </ComPerfil>
          }
        />

        <Route
          path="/financeiro/mensalidades"
          element={
            <ComPerfil
              allowed={FINANCEIRO}
            >
              <Mensalidades />
            </ComPerfil>
          }
        />

        <Route
          path="/financeiro/mensalidades/:id/pagar"
          element={
            <ComPerfil
              allowed={FINANCEIRO}
            >
              <RegistrarPagamento />
            </ComPerfil>
          }
        />

        <Route
          path="/financeiro/pagamentos"
          element={
            <ComPerfil
              allowed={FINANCEIRO}
            >
              <Pagamentos />
            </ComPerfil>
          }
        />

        <Route
          path="/financeiro/pagamentos/:id/recibo"
          element={
            <ComPerfil
              allowed={FINANCEIRO}
            >
              <ReciboPagamento />
            </ComPerfil>
          }
        />

        <Route
          path="/financeiro/inadimplentes"
          element={
            <ComPerfil
              allowed={FINANCEIRO}
            >
              <Inadimplentes />
            </ComPerfil>
          }
        />

        <Route
          path="/relatorios"
          element={
            <ComPerfil
              allowed={RELATORIOS}
            >
              <Relatorios />
            </ComPerfil>
          }
        />

        <Route
          path="/relatorios/financeiro"
          element={
            <ComPerfil
              allowed={FINANCEIRO}
            >
              <RelatorioFinanceiro />
            </ComPerfil>
          }
        />

        <Route
          path="/relatorios/frequencia"
          element={
            <ComPerfil
              allowed={PRESENCAS}
            >
              <RelatorioFrequencia />
            </ComPerfil>
          }
        />

        <Route
          path="/relatorios/turmas"
          element={
            <ComPerfil
              allowed={PRESENCAS}
            >
              <RelatorioTurmas />
            </ComPerfil>
          }
        />

        <Route
          path="/relatorios/graduacoes"
          element={
            <ComPerfil
              allowed={GRADUACOES}
            >
              <RelatorioGraduacoes />
            </ComPerfil>
          }
        />

        <Route
          path="/configuracoes"
          element={
            <ComPerfil allowed={ADMIN}>
              <Configuracoes />
            </ComPerfil>
          }
        />

        <Route
          path="/configuracoes/usuarios"
          element={
            <ComPerfil allowed={ADMIN}>
              <Usuarios />
            </ComPerfil>
          }
        />

        <Route
          path="/configuracoes/usuarios/novo"
          element={
            <ComPerfil allowed={ADMIN}>
              <NovoUsuario />
            </ComPerfil>
          }
        />

        <Route
          path="/configuracoes/usuarios/:id/editar"
          element={
            <ComPerfil allowed={ADMIN}>
              <EditarUsuario />
            </ComPerfil>
          }
        />
      </Route>
  
        <Route
           path="/configuracoes/academia"
           element={
        <ComPerfil allowed={ADMIN}>
      <ConfiguracoesAcademia />
    </ComPerfil>
  }
/>
      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
    
  );
}
