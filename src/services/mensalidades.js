import { supabase } from "./supabaseClient";

function diferencaMeses(dataInicio, anoRef, mesRef) {
  const inicio = new Date(`${dataInicio}T12:00:00`);

  return (
    (anoRef - inicio.getFullYear()) * 12 +
    (mesRef - 1 - inicio.getMonth())
  );
}

function deveGerar(matricula, ano, mes) {
  if (!matricula.data_inicio) return true;

  const diferenca = diferencaMeses(
    matricula.data_inicio,
    ano,
    mes
  );

  if (diferenca < 0) return false;

  const periodicidade =
    matricula.planos?.periodicidade || "mensal";

  if (periodicidade === "avulso") {
    return diferenca === 0;
  }

  const intervalo = {
    mensal: 1,
    trimestral: 3,
    semestral: 6,
    anual: 12,
  }[periodicidade];

  return intervalo ? diferenca % intervalo === 0 : true;
}

export function calcularVencimento(referenciaMes, diaVencimento) {
  const [ano, mes] = referenciaMes.split("-").map(Number);
  const ultimoDia = new Date(ano, mes, 0).getDate();

  const dia = Math.min(
    Math.max(Number(diaVencimento) || 1, 1),
    ultimoDia
  );

  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export async function gerarMensalidades(referenciaMes) {
  if (!referenciaMes) {
    throw new Error("Informe o mês de referência.");
  }

  const [ano, mes] = referenciaMes.split("-").map(Number);
  const referencia = `${ano}-${String(mes).padStart(2, "0")}-01`;

  const { data: matriculas, error: erroMatriculas } =
    await supabase
      .from("matriculas")
      .select(`
        id,
        aluno_id,
        data_inicio,
        data_fim,
        dia_vencimento,
        valor_mensalidade,
        status,
        alunos (
          id,
          nome,
          status
        ),
        planos (
          id,
          nome,
          valor,
          periodicidade
        )
      `)
      .eq("status", "ativa");

  if (erroMatriculas) throw erroMatriculas;

  const validas = (matriculas || []).filter((matricula) => {
    if (matricula.alunos?.status !== "ativo") return false;
    if (!deveGerar(matricula, ano, mes)) return false;
    if (matricula.data_fim && referencia > matricula.data_fim) return false;
    return true;
  });

  if (validas.length === 0) {
    return { geradas: 0, existentes: 0, total: 0 };
  }

  const ids = validas.map((item) => item.id);

  const { data: existentes, error: erroExistentes } =
    await supabase
      .from("mensalidades")
      .select("matricula_id")
      .eq("referencia", referencia)
      .in("matricula_id", ids);

  if (erroExistentes) throw erroExistentes;

  const setExistentes = new Set(
    (existentes || []).map((item) => item.matricula_id)
  );

  const novas = validas
    .filter((item) => !setExistentes.has(item.id))
    .map((matricula) => ({
      aluno_id: matricula.aluno_id,
      matricula_id: matricula.id,
      referencia,
      vencimento: calcularVencimento(
        referenciaMes,
        matricula.dia_vencimento
      ),
      valor: Number(
        matricula.valor_mensalidade ??
          matricula.planos?.valor ??
          0
      ),
      desconto: 0,
      acrescimo: 0,
      status: "pendente",
    }));

  if (novas.length > 0) {
    const { error } = await supabase
      .from("mensalidades")
      .insert(novas);

    if (error) throw error;
  }

  return {
    geradas: novas.length,
    existentes: validas.length - novas.length,
    total: validas.length,
  };
}
