export function baixarCSV(nomeArquivo, cabecalhos, linhas) {
  const escapar = (valor) => {
    if (valor === null || valor === undefined) return "";

    const texto = String(valor).replace(/"/g, '""');

    return `"${texto}"`;
  };

  const conteudo = [
    cabecalhos.map(escapar).join(";"),
    ...linhas.map((linha) =>
      linha.map(escapar).join(";")
    ),
  ].join("\n");

  const blob = new Blob(
    ["\ufeff" + conteudo],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = nomeArquivo;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL",
    }
  );
}

export function formatarData(data) {
  if (!data) return "-";

  return new Date(
    `${data}T12:00:00`
  ).toLocaleDateString("pt-BR");
}

export function formatarDataHora(data) {
  if (!data) return "-";

  return new Date(data).toLocaleString(
    "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
    }
  );
}

export function hojeISO() {
  const data = new Date();
  const offset = data.getTimezoneOffset();

  return new Date(
    data.getTime() -
      offset * 60 * 1000
  )
    .toISOString()
    .split("T")[0];
}

export function inicioMesISO() {
  const agora = new Date();

  const data = new Date(
    agora.getFullYear(),
    agora.getMonth(),
    1
  );

  const offset = data.getTimezoneOffset();

  return new Date(
    data.getTime() -
      offset * 60 * 1000
  )
    .toISOString()
    .split("T")[0];
}

export function inicioDiaTimestamp(data) {
  return `${data}T00:00:00`;
}

export function fimDiaTimestamp(data) {
  return `${data}T23:59:59`;
}
