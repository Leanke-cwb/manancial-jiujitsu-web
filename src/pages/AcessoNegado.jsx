import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldX,
  ArrowLeft,
} from "lucide-react";

export default function AcessoNegado() {
  const navigate = useNavigate();

  return (
    <div className="page-content">
      <div className="access-denied-card">
        <div className="access-denied-icon">
          <ShieldX size={34} />
        </div>

        <h1>Acesso não permitido</h1>

        <p>
          Seu perfil não possui permissão para
          acessar este módulo.
        </p>

        <button
          className="btn-primary"
          onClick={() =>
            navigate("/dashboard")
          }
        >
          <ArrowLeft size={18} />
          Voltar ao Dashboard
        </button>
      </div>
    </div>
  );
}
