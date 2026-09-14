import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  Users,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export default function Configuracoes() {
  const navigate = useNavigate();

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Configurações</h1>

          <p>
            Gerencie os dados institucionais,
            usuários e permissões do sistema.
          </p>
        </div>
      </header>

      <div className="settings-grid">
        <button
          className="settings-card"
          onClick={() =>
            navigate(
              "/configuracoes/academia"
            )
          }
        >
          <div>
            <div className="settings-card-icon">
              <Building2 size={22} />
            </div>

            <h2>
              Dados da academia
            </h2>

            <p>
              Nome, documento, contato, endereço,
              logo, PIX e dados para recibos.
            </p>
          </div>

          <ArrowRight size={20} />
        </button>

        <button
          className="settings-card"
          onClick={() =>
            navigate(
              "/configuracoes/usuarios"
            )
          }
        >
          <div>
            <div className="settings-card-icon">
              <Users size={22} />
            </div>

            <h2>Usuários</h2>

            <p>
              Convide usuários, altere perfis e
              ative ou inative acessos.
            </p>
          </div>

          <ArrowRight size={20} />
        </button>

        <div className="settings-card settings-card-static">
          <div>
            <div className="settings-card-icon">
              <ShieldCheck size={22} />
            </div>

            <h2>
              Perfis de acesso
            </h2>

            <p>
              Administrador, professor, instrutor,
              recepção e aluno.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
