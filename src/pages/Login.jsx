import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LockKeyhole, Mail } from "lucide-react";
import { supabase } from "../services/supabaseClient";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    verificarSessao();
  }, []);

  const verificarSessao = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      navigate("/dashboard");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email.trim() || !senha) {
      setErro("Informe o e-mail e a senha.");
      return;
    }

    try {
      setLoading(true);
      setErro("");

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: senha,
        });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error(
          "Não foi possível identificar o usuário."
        );
      }

      const { data: usuario, error: erroUsuario } =
        await supabase
          .from("usuarios")
          .select("id, nome, perfil, ativo")
          .eq("user_id", data.user.id)
          .maybeSingle();

      if (erroUsuario) {
        throw erroUsuario;
      }

      if (!usuario) {
        await supabase.auth.signOut();

        setErro(
          "Usuário autenticado, mas não cadastrado no sistema."
        );

        return;
      }

      if (!usuario.ativo) {
        await supabase.auth.signOut();

        setErro("Este usuário está desativado.");

        return;
      }

      navigate("/dashboard");
    } catch (error) {
      console.error("Erro no login:", error);

      if (error.message === "Invalid login credentials") {
        setErro("E-mail ou senha incorretos.");
      } else {
        setErro(
          error.message ||
            "Não foi possível realizar o login."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-brand-area">
        <div className="brand-content">
          <span className="brand-small">
            ESCOLA DE
          </span>

          <h1>MANANCIAL</h1>

          <h2>JIU JITSU</h2>

          <div className="brand-line" />

          <p>
            Gestão, disciplina e evolução dentro e
            fora do tatame.
          </p>
        </div>
      </section>

      <section className="login-form-area">
        <form
          className="login-card"
          onSubmit={handleLogin}
        >
          <div className="login-header">
            <h2>Acesso ao sistema</h2>

            <p>
              Entre com suas credenciais para
              continuar.
            </p>
          </div>

          {erro && (
            <div className="alert-error">
              {erro}
            </div>
          )}

          <div className="form-group">
            <label>E-mail</label>

            <div className="input-container">
              <Mail size={19} />

              <input
                type="email"
                placeholder="seuemail@email.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Senha</label>

            <div className="input-container">
              <LockKeyhole size={19} />

              <input
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(e) =>
                  setSenha(e.target.value)
                }
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-login"
            disabled={loading}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="login-footer">
            Manancial Jiu Jitsu
          </div>
        </form>
      </section>
    </div>
  );
}