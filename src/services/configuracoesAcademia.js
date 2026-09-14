import { supabase } from "./supabaseClient";

const BUCKET = "logo-academia";
const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
const TAMANHO_MAXIMO = 5 * 1024 * 1024;

export async function obterConfiguracoesAcademia() {
  const { data, error } = await supabase
    .from("configuracoes_academia")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;

  return data;
}

export async function salvarConfiguracoesAcademia(dados) {
  const payload = {
    id: 1,
    nome_academia: dados.nome_academia?.trim() || "Manancial Jiu Jitsu",
    documento: dados.documento?.trim() || null,
    telefone: dados.telefone?.trim() || null,
    email: dados.email?.trim() || null,
    cep: dados.cep?.trim() || null,
    endereco: dados.endereco?.trim() || null,
    numero: dados.numero?.trim() || null,
    complemento: dados.complemento?.trim() || null,
    bairro: dados.bairro?.trim() || null,
    cidade: dados.cidade?.trim() || null,
    estado: dados.estado?.trim() || null,
    responsavel_nome: dados.responsavel_nome?.trim() || null,
    pix_chave: dados.pix_chave?.trim() || null,
    recibo_observacoes: dados.recibo_observacoes?.trim() || null,
    logo_path: dados.logo_path || null,
  };

  const { data, error } = await supabase
    .from("configuracoes_academia")
    .upsert(payload, {
      onConflict: "id",
    })
    .select()
    .single();

  if (error) throw error;

  return data;
}

export function validarLogoAcademia(file) {
  if (!file) return;

  if (!TIPOS_PERMITIDOS.includes(file.type)) {
    throw new Error(
      "Formato inválido. Utilize JPG, PNG ou WebP."
    );
  }

  if (file.size > TAMANHO_MAXIMO) {
    throw new Error(
      "O logo deve possuir no máximo 5 MB."
    );
  }
}

function obterExtensao(file) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

export async function uploadLogoAcademia(file) {
  validarLogoAcademia(file);

  const extensao = obterExtensao(file);

  const caminhosPossiveis = [
    "logo/logo-academia.jpg",
    "logo/logo-academia.png",
    "logo/logo-academia.webp",
  ];

  await supabase.storage
    .from(BUCKET)
    .remove(caminhosPossiveis);

  const caminho = `logo/logo-academia.${extensao}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, file, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: true,
    });

  if (error) throw error;

  return caminho;
}

export async function removerLogoAcademia(caminho) {
  if (!caminho) return;

  const { error } = await supabase.storage
    .from(BUCKET)
    .remove([caminho]);

  if (error) throw error;
}

export function obterUrlLogoAcademia(caminho) {
  if (!caminho) return null;

  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(caminho);

  return data?.publicUrl || null;
}
