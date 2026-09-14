import React, {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import {
  KeyRound,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

export default function AtivarConta() {
  const navigate = useNavigate();

  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [sessaoValida, setSessaoValida] =
    useState(false);

  const [erroConvite, setErroConvite] =
    useState("");

  const [salvando, setSalvando] =
    useState(false);

  useEffect(() => {
    prepararSessao();
  }, []);

  const prepararSessao = async () => {
    try {
      setLoading(true);
      setErroConvite("");

      const params =
        new URLSearchParams(
          window.location.search
        );

      const tokenHash =
        params.get("token_hash");

      const tipo =
        params.get("type");

      const code =
        params.get("code");

      // --------------------------------------------------
      // FLUXO 1:
      // Link personalizado:
      // /ativar-conta?token_hash=...&type=invite
      // --------------------------------------------------
      if (
        tokenHash &&
        tipo === "invite"
      ) {
        const {
          error: verifyError,
        } =
          await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "invite",
          });

        if (verifyError) {
          throw verifyError;
        }

        // Limpa token da barra do navegador
        window.history.replaceState(
          {},
          document.title,
          "/ativar-conta"
        );
      }

      // --------------------------------------------------
      // FLUXO 2:
      // PKCE / ?code=...
      // --------------------------------------------------
      else if (code) {
        const {
          error: codeError,
        } =
          await supabase.auth.exchangeCodeForSession(
            code
          );

        if (codeError) {
          console.warn(
            "Falha ao trocar code por sessão:",
            codeError
          );
        }

        window.history.replaceState(
          {},
          document.title,
          "/ativar-conta"
        );
      }

      // --------------------------------------------------
      // FLUXO 3:
      // ConfirmationURL pode já ter criado
      // a sessão antes de abrir esta página.
      // --------------------------------------------------
      const {
        data,
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (sessionError) {
        throw sessionError;
      }

      if (data?.session) {
        setSessaoValida(true);
        return;
      }

      setSessaoValida(false);

      setErroConvite(
        "Não foi possível validar o convite. Ele pode ter expirado ou já ter sido utilizado."
      );
    } catch (error) {
      console.error(
        "Erro ao validar convite:",
        error
      );

      setSessaoValida(false);

      setErroConvite(
        error?.message ||
          "Não foi possível validar o convite."
      );
    } finally {
      setLoading(false);
    }
  };

  const definirSenha = async (e) => {
    e.preventDefault();

    if (senha.length < 8) {
      alert(
        "A senha deve possuir pelo menos 8 caracteres."
      );
      return;
    }

    if (senha !== confirmacao) {
      alert(
        "As senhas não conferem."
      );
      return;
    }

    try {
      setSalvando(true);

      const {
        error,
      } =
        await supabase.auth.updateUser({
          password: senha,
        });

      if (error) throw error;

      await supabase.auth.signOut();

      alert(
        "Senha definida com sucesso. Faça login com seu e-mail e a nova senha."
      );

      navigate("/");
    } catch (error) {
      console.error(
        "Erro ao definir senha:",
        error
      );

      alert(
        `Erro ao definir senha: ${
          error.message ||
          "erro desconhecido"
        }`
      );
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="activation-page">
        <div className="activation-card">
          Validando convite...
        </div>
      </div>
    );
  }

  if (!sessaoValida) {
    return (
      <div className="activation-page">
        <div className="activation-card">
          <div className="activation-icon">
            <KeyRound size={30} />
          </div>

          <h1>Convite inválido</h1>

          <p>
            {erroConvite ||
              "O convite pode ter expirado ou já ter sido utilizado."}
          </p>

          <button
            className="btn-primary"
            onClick={() =>
              navigate("/")
            }
          >
            Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="activation-page">
      <form
        className="activation-card"
        onSubmit={definirSenha}
      >
        <div className="activation-icon">
          <ShieldCheck size={30} />
        </div>

        <h1>Ativar conta</h1>

        <p>
          Convite validado. Defina uma senha
          para acessar o Manancial Jiu Jitsu.
        </p>

        <div className="form-field">
          <label>Nova senha</label>

          <input
            type="password"
            value={senha}
            onChange={(e) =>
              setSenha(e.target.value)
            }
            placeholder="Mínimo de 8 caracteres"
            autoComplete="new-password"
          />
        </div>

        <div className="form-field">
          <label>
            Confirmar senha
          </label>

          <input
            type="password"
            value={confirmacao}
            onChange={(e) =>
              setConfirmacao(
                e.target.value
              )
            }
            autoComplete="new-password"
          />
        </div>

        <button
          className="btn-primary"
          type="submit"
          disabled={salvando}
        >
          {salvando
            ? "Salvando..."
            : "Definir senha"}
        </button>
      </form>
    </div>
  );
}
