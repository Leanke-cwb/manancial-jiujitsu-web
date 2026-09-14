import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";

export default function useUsuarioAtual() {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      try {
        setLoading(true);

        const {
          data: authData,
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        const userId = authData?.user?.id;

        if (!userId) {
          if (ativo) setUsuario(null);
          return;
        }

        const {
          data,
          error,
        } = await supabase
          .from("usuarios")
          .select(`
            id,
            user_id,
            nome,
            email,
            telefone,
            perfil,
            ativo
          `)
          .eq("user_id", userId)
          .maybeSingle();

        if (error) throw error;

        if (ativo) {
          setUsuario(data || null);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar usuário atual:",
          error
        );

        if (ativo) {
          setUsuario(null);
        }
      } finally {
        if (ativo) {
          setLoading(false);
        }
      }
    };

    carregar();

    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange(
      () => {
        carregar();
      }
    );

    return () => {
      ativo = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  return {
    usuario,
    loading,
    perfil: usuario?.perfil || null,
    ativo: usuario?.ativo === true,
  };
}
