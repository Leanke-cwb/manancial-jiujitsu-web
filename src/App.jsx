import React from "react";

import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
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

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

function PaginaTemporaria({ titulo }) {
  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>{titulo}</h1>
          <p>
            Este módulo será desenvolvido nas próximas etapas.
          </p>
        </div>
      </header>

      <section className="content-card">
        Módulo {titulo} em desenvolvimento.
      </section>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

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
          path="/alunos"
          element={<Alunos />}
        />

        <Route
          path="/alunos/novo"
          element={<CadastrarAluno />}
        />

        <Route
          path="/alunos/:id/editar"
          element={<EditarAluno />}
        />

        <Route
          path="/alunos/:id/matricular"
          element={<MatricularAluno />}
        />

        <Route
          path="/alunos/:id"
          element={<PerfilAluno />}
        />

        <Route
          path="/professores"
          element={<Professores />}
        />

        <Route
          path="/professores/novo"
          element={<CadastrarProfessor />}
        />

        <Route
          path="/professores/:id/editar"
          element={<EditarProfessor />}
        />

        <Route
          path="/turmas"
          element={<Turmas />}
        />

        <Route
          path="/turmas/nova"
          element={<CadastrarTurma />}
        />

        <Route
          path="/turmas/:id/editar"
          element={<EditarTurma />}
        />

        <Route
          path="/turmas/:id/alunos"
          element={<TurmaAlunos />}
        />

        <Route
          path="/presencas"
          element={<Presencas />}
        />

        <Route
          path="/graduacoes"
          element={<Graduacoes />}
        />

        <Route
          path="/graduacoes/nova"
          element={<NovaGraduacao />}
        />

        <Route
          path="/financeiro"
          element={<Financeiro />}
        />

        <Route
          path="/financeiro/planos"
          element={<Planos />}
        />

        <Route
          path="/financeiro/planos/novo"
          element={<NovoPlano />}
        />

        <Route
          path="/financeiro/planos/:id/editar"
          element={<EditarPlano />}
        />

        <Route
          path="/financeiro/mensalidades"
          element={<Mensalidades />}
        />

        <Route
          path="/financeiro/mensalidades/:id/pagar"
          element={<RegistrarPagamento />}
        />

        <Route
          path="/financeiro/pagamentos"
          element={<Pagamentos />}
        />

        <Route
          path="/financeiro/pagamentos/:id/recibo"
          element={<ReciboPagamento />}
        />

        <Route
          path="/financeiro/inadimplentes"
          element={<Inadimplentes />}
        />

        <Route
          path="/relatorios"
          element={<Relatorios />}
        />

        <Route
          path="/relatorios/financeiro"
          element={<RelatorioFinanceiro />}
        />

        <Route
          path="/relatorios/frequencia"
          element={<RelatorioFrequencia />}
        />

        <Route
          path="/relatorios/turmas"
          element={<RelatorioTurmas />}
        />

        <Route
          path="/relatorios/graduacoes"
          element={<RelatorioGraduacoes />}
        />

        <Route
          path="/configuracoes"
          element={
            <PaginaTemporaria titulo="Configurações" />
          }
        />
      </Route>

      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
