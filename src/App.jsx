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

import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";

function PaginaTemporaria({ titulo }) {
  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>{titulo}</h1>

          <p>
            Este módulo será desenvolvido nas
            próximas etapas.
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
      <Route
        path="/"
        element={<Login />}
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
          path="/professores"
          element={
            <PaginaTemporaria titulo="Professores" />
          }
        />

        <Route
          path="/turmas"
          element={
            <PaginaTemporaria titulo="Turmas" />
          }
        />

        <Route
          path="/presencas"
          element={
            <PaginaTemporaria titulo="Presenças" />
          }
        />

        <Route
          path="/graduacoes"
          element={
            <PaginaTemporaria titulo="Graduações" />
          }
        />

        <Route
          path="/financeiro"
          element={
            <PaginaTemporaria titulo="Financeiro" />
          }
        />

        <Route
          path="/relatorios"
          element={
            <PaginaTemporaria titulo="Relatórios" />
          }
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