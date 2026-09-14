import React from "react";
import { Navigate } from "react-router-dom";
import useUsuarioAtual from "../hooks/useUsuarioAtual";

export default function RoleRoute({
  allowed = [],
  children,
}) {
  const {
    usuario,
    loading,
  } = useUsuarioAtual();

  if (loading) {
    return (
      <div className="page-content">
        <div className="loading-inline">
          Verificando acesso...
        </div>
      </div>
    );
  }

  if (!usuario || !usuario.ativo) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (
    allowed.length > 0 &&
    !allowed.includes(usuario.perfil)
  ) {
    return (
      <Navigate
        to="/acesso-negado"
        replace
      />
    );
  }

  return children;
}
