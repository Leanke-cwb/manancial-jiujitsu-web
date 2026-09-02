import { supabase } from "./supabaseClient";

const BUCKET = "fotos-alunos";

const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

const TAMANHO_MAXIMO = 5 * 1024 * 1024;

export function validarFotoAluno(file) {
  if (!file) return;

  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    throw new Error(
      "Formato inválido. Utilize JPG, PNG ou WebP."
    );
  }

  if (file.size > TAMANHO_MAXIMO) {
    throw new Error(
      "A foto deve possuir no máximo 5 MB."
    );
  }
}

function obterExtensao(file) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadFotoAluno(alunoId, file) {
  validarFotoAluno(file);

  const extensao = obterExtensao(file);
  const caminho = `${alunoId}/perfil-${Date.now()}.${extensao}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) throw error;

  return caminho;
}

export async function obterUrlFotoAluno(
  caminho,
  expiracao = 3600
) {
  if (!caminho) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(caminho, expiracao);

  if (error) {
    console.error("Erro ao gerar URL da foto:", error);
    return null;
  }

  return data?.signedUrl || null;
}

export async function removerFotoAluno(caminho) {
  if (!caminho) return;

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([caminho]);

  if (error) throw error;
}
