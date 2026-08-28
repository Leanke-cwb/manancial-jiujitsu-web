import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function ProtectedRoute({
  children,
}) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    const carregarSessao = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (ativo) {
          setSession(session);
          setLoading(false);
        }
      } catch (error) {
        console.error(
          "Erro ao verificar sessão:",
          error
        );

        if (ativo) {
          setLoading(false);
        }
      }
    };

    carregarSessao();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (ativo) {
          setSession(session);
          setLoading(false);
        }
      }
    );

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <strong>MANANCIAL</strong>
        <span>Carregando...</span>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  return children;
}