import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PERFIS = [
  "admin",
  "professor",
  "instrutor",
  "recepcao",
  "aluno",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Método não permitido.",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  let novoAuthUserId: string | null = null;

  try {
    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const anonKey =
      Deno.env.get("SUPABASE_ANON_KEY");

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      );

    if (
      !supabaseUrl ||
      !anonKey ||
      !serviceRoleKey
    ) {
      throw new Error(
        "Variáveis do Supabase não configuradas."
      );
    }

    const authorization =
      req.headers.get("Authorization");

    if (!authorization) {
      return new Response(
        JSON.stringify({
          error: "Usuário não autenticado.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const authClient = createClient(
      supabaseUrl,
      anonKey,
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const serviceClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const {
      data: authData,
      error: authError,
    } = await authClient.auth.getUser();

    if (
      authError ||
      !authData?.user?.id
    ) {
      return new Response(
        JSON.stringify({
          error: "Sessão inválida.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const {
      data: admin,
      error: adminError,
    } = await serviceClient
      .from("usuarios")
      .select("id, perfil, ativo")
      .eq(
        "user_id",
        authData.user.id
      )
      .maybeSingle();

    if (
      adminError ||
      !admin ||
      !admin.ativo ||
      admin.perfil !== "admin"
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Somente administradores podem criar usuários.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body = await req.json();

    const nome =
      String(body?.nome || "").trim();

    const email =
      String(body?.email || "")
        .trim()
        .toLowerCase();

    const telefone =
      String(body?.telefone || "").trim();

    const perfil =
      String(body?.perfil || "").trim();

    const redirectTo =
      String(
        body?.redirectTo || ""
      ).trim();

    if (!nome) {
      throw new Error(
        "Informe o nome do usuário."
      );
    }

    if (!email) {
      throw new Error(
        "Informe o e-mail do usuário."
      );
    }

    if (!PERFIS.includes(perfil)) {
      throw new Error(
        "Perfil de acesso inválido."
      );
    }

    const {
      data: convite,
      error: conviteError,
    } =
      await serviceClient.auth.admin.inviteUserByEmail(
        email,
        {
          redirectTo:
            redirectTo || undefined,
          data: {
            nome,
            perfil,
          },
        }
      );

    if (
      conviteError ||
      !convite?.user?.id
    ) {
      throw new Error(
        conviteError?.message ||
          "Não foi possível enviar o convite."
      );
    }

    novoAuthUserId =
      convite.user.id;

    const {
      error: usuarioError,
    } = await serviceClient
      .from("usuarios")
      .insert({
        user_id:
          convite.user.id,
        nome,
        email,
        telefone:
          telefone || null,
        perfil,
        ativo: true,
      });

    if (usuarioError) {
      await serviceClient.auth.admin.deleteUser(
        convite.user.id
      );

      novoAuthUserId = null;

      throw new Error(
        usuarioError.message
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_id:
          convite.user.id,
        message:
          "Convite enviado com sucesso.",
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : "Erro inesperado.",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
