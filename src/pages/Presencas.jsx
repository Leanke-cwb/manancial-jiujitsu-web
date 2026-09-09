import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  Save,
  Users,
  CalendarDays,
} from "lucide-react";
import { supabase } from "../services/supabaseClient";

function hojeLocal() {
  const agora = new Date();
  const offset = agora.getTimezoneOffset();

  return new Date(
    agora.getTime() - offset * 60 * 1000
  )
    .toISOString()
    .split("T")[0];
}

function horaLocal() {
  const agora = new Date();

  return `${String(agora.getHours()).padStart(2, "0")}:${String(
    agora.getMinutes()
  ).padStart(2, "0")}`;
}

export default function Presencas() {
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState("");
  const [data, setData] = useState(hojeLocal());
  const [horario, setHorario] = useState(horaLocal());

  const [alunos, setAlunos] = useState([]);
  const [selecionados, setSelecionados] = useState(new Set());
  const [presencasExistentes, setPresencasExistentes] = useState([]);

  const [loadingTurmas, setLoadingTurmas] = useState(true);
  const [loadingAlunos, setLoadingAlunos] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarTurmas();
  }, []);

  useEffect(() => {
    if (turmaId && data) {
      carregarLista();
    } else {
      setAlunos([]);
      setSelecionados(new Set());
      setPresencasExistentes([]);
    }
  }, [turmaId, data]);

  const carregarTurmas = async () => {
    try {
      setLoadingTurmas(true);

      const { data, error } = await supabase
        .from("turmas")
        .select(`
          id,
          nome,
          categoria,
          professores (nome)
        `)
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) throw error;

      setTurmas(data || []);

      if (data?.length === 1) {
        setTurmaId(data[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
      alert("Não foi possível carregar as turmas.");
    } finally {
      setLoadingTurmas(false);
    }
  };

  const carregarLista = async () => {
    try {
      setLoadingAlunos(true);

      const [
        { data: vinculos, error: erroVinculos },
        { data: presencas, error: erroPresencas },
      ] = await Promise.all([
        supabase
          .from("turma_alunos")
          .select(`
            id,
            aluno_id,
            alunos (
              id,
              nome,
              faixa,
              grau,
              status
            )
          `)
          .eq("turma_id", turmaId)
          .eq("ativo", true),

        supabase
          .from("presencas")
          .select(`
            id,
            aluno_id,
            turma_id,
            data,
            horario,
            tipo_registro
          `)
          .eq("turma_id", turmaId)
          .eq("data", data),
      ]);

      if (erroVinculos) throw erroVinculos;
      if (erroPresencas) throw erroPresencas;

      const alunosDaTurma = (vinculos || [])
        .map((item) => item.alunos)
        .filter(
          (aluno) =>
            aluno &&
            aluno.status === "ativo"
        )
        .sort((a, b) =>
          a.nome.localeCompare(b.nome)
        );

      const idsComPresenca = new Set(
        (presencas || []).map(
          (item) => item.aluno_id
        )
      );

      setAlunos(alunosDaTurma);
      setSelecionados(idsComPresenca);
      setPresencasExistentes(presencas || []);

      if (presencas?.length) {
        const primeiroHorario =
          presencas[0]?.horario?.slice(0, 5);

        if (primeiroHorario) {
          setHorario(primeiroHorario);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar chamada:", error);
      alert("Não foi possível carregar a chamada.");
    } finally {
      setLoadingAlunos(false);
    }
  };

  const alternarAluno = (alunoId) => {
    setSelecionados((atual) => {
      const novo = new Set(atual);

      if (novo.has(alunoId)) {
        novo.delete(alunoId);
      } else {
        novo.add(alunoId);
      }

      return novo;
    });
  };

  const marcarTodos = () => {
    if (selecionados.size === alunos.length) {
      setSelecionados(new Set());
      return;
    }

    setSelecionados(
      new Set(alunos.map((aluno) => aluno.id))
    );
  };

  const salvar = async () => {
    if (!turmaId) {
      alert("Selecione uma turma.");
      return;
    }

    if (!data) {
      alert("Informe a data.");
      return;
    }

    if (!horario) {
      alert("Informe o horário.");
      return;
    }

    try {
      setSalvando(true);

      const {
        data: userData,
        error: erroUsuario,
      } = await supabase.auth.getUser();

      if (erroUsuario) throw erroUsuario;

      const authUserId = userData?.user?.id;

      if (!authUserId) {
        throw new Error("Usuário autenticado não encontrado.");
      }

      const {
        data: usuarioSistema,
        error: erroUsuarioSistema,
      } = await supabase
        .from("usuarios")
        .select("id")
        .eq("user_id", authUserId)
        .eq("ativo", true)
        .single();

      if (erroUsuarioSistema) {
        throw erroUsuarioSistema;
      }

      const usuarioId = usuarioSistema.id;

      const idsExistentes = new Set(
        presencasExistentes.map(
          (item) => item.aluno_id
        )
      );

      const novosIds = [...selecionados].filter(
        (alunoId) =>
          !idsExistentes.has(alunoId)
      );

      const removidosIds =
        presencasExistentes
          .filter(
            (item) =>
              !selecionados.has(item.aluno_id)
          )
          .map((item) => item.id);

      if (novosIds.length > 0) {
        const { error: erroInserir } = await supabase
          .from("presencas")
          .upsert(
            novosIds.map((alunoId) => ({
              aluno_id: alunoId,
              turma_id: turmaId,
              data,
              horario,
              tipo_registro: "manual",
              registrado_por: usuarioId,
            })),
            {
              onConflict:
                "aluno_id,turma_id,data",
            }
          );

        if (erroInserir) throw erroInserir;
      }

      if (removidosIds.length > 0) {
        const { error: erroRemover } = await supabase
          .from("presencas")
          .delete()
          .in("id", removidosIds);

        if (erroRemover) throw erroRemover;
      }

      const idsMantidos = presencasExistentes
        .filter((item) =>
          selecionados.has(item.aluno_id)
        )
        .map((item) => item.id);

      if (idsMantidos.length > 0) {
        const { error: erroAtualizar } = await supabase
          .from("presencas")
          .update({ horario })
          .in("id", idsMantidos);

        if (erroAtualizar) throw erroAtualizar;
      }

      alert("Presenças salvas com sucesso!");

      await carregarLista();
    } catch (error) {
      console.error("Erro ao salvar presenças:", error);

      alert(
        `Erro ao salvar presenças: ${
          error.message || "erro desconhecido"
        }`
      );
    } finally {
      setSalvando(false);
    }
  };

  const turmaSelecionada = useMemo(
    () =>
      turmas.find(
        (turma) => turma.id === turmaId
      ),
    [turmas, turmaId]
  );

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Presenças</h1>
          <p>Faça a chamada dos alunos por turma e data.</p>
        </div>
      </header>

      <section className="content-card">
        <div className="attendance-filters">
          <div className="form-field">
            <label>Turma</label>

            <select
              value={turmaId}
              disabled={loadingTurmas}
              onChange={(e) => setTurmaId(e.target.value)}
            >
              <option value="">
                Selecione uma turma
              </option>

              {turmas.map((turma) => (
                <option
                  key={turma.id}
                  value={turma.id}
                >
                  {turma.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label>Data</label>

            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label>Horário</label>

            <input
              type="time"
              value={horario}
              onChange={(e) => setHorario(e.target.value)}
            />
          </div>
        </div>
      </section>

      {turmaId && (
        <>
          <div className="attendance-summary-grid">
            <div className="attendance-summary-card">
              <Users size={20} />
              <span>Alunos na turma</span>
              <strong>{alunos.length}</strong>
            </div>

            <div className="attendance-summary-card">
              <Check size={20} />
              <span>Presentes</span>
              <strong>{selecionados.size}</strong>
            </div>

            <div className="attendance-summary-card">
              <CalendarDays size={20} />
              <span>Turma</span>
              <strong>
                {turmaSelecionada?.nome || "-"}
              </strong>
            </div>
          </div>

          <section className="content-card">
            <div className="attendance-header">
              <div>
                <h2>Chamada</h2>
                <p>Marque os alunos presentes.</p>
              </div>

              {alunos.length > 0 && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={marcarTodos}
                >
                  {selecionados.size === alunos.length
                    ? "Desmarcar todos"
                    : "Marcar todos"}
                </button>
              )}
            </div>

            {loadingAlunos ? (
              <div className="table-message">
                Carregando alunos...
              </div>
            ) : alunos.length === 0 ? (
              <div className="empty-state">
                Esta turma ainda não possui alunos vinculados.
              </div>
            ) : (
              <div className="attendance-list">
                {alunos.map((aluno) => {
                  const presente =
                    selecionados.has(aluno.id);

                  return (
                    <button
                      type="button"
                      key={aluno.id}
                      className={`attendance-student ${
                        presente ? "present" : ""
                      }`}
                      onClick={() =>
                        alternarAluno(aluno.id)
                      }
                    >
                      <div className="attendance-check">
                        {presente && (
                          <Check size={17} />
                        )}
                      </div>

                      <div>
                        <strong>{aluno.nome}</strong>

                        <span>
                          {aluno.faixa || "-"}
                          {" • "}
                          {aluno.grau ?? 0}º grau
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {alunos.length > 0 && (
              <div className="attendance-actions">
                <button
                  className="btn-primary"
                  disabled={salvando}
                  onClick={salvar}
                >
                  <Save size={18} />

                  {salvando
                    ? "Salvando..."
                    : "Salvar presenças"}
                </button>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
