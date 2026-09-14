import React, { useEffect, useMemo, useState } from "react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Award,
  Save,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

function hojeLocal() {
  const agora = new Date();
  const offset = agora.getTimezoneOffset();

  return new Date(
    agora.getTime() -
      offset * 60 * 1000
  )
    .toISOString()
    .split("T")[0];
}

export default function NovaGraduacao() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const alunoInicial =
    searchParams.get("aluno") || "";

  const [alunos, setAlunos] = useState([]);
  const [professores, setProfessores] =
    useState([]);

  const [alunoId, setAlunoId] =
    useState(alunoInicial);

  const [novaFaixa, setNovaFaixa] =
    useState("");

  const [novoGrau, setNovoGrau] =
    useState(0);

  const [professorId, setProfessorId] =
    useState("");

  const [dataGraduacao, setDataGraduacao] =
    useState(hojeLocal());

  const [observacoes, setObservacoes] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  useEffect(() => {
    carregar();
  }, []);

  const carregar = async () => {
    try {
      setLoading(true);

      const [
        { data: alunosData, error: erroAlunos },
        {
          data: professoresData,
          error: erroProfessores,
        },
      ] = await Promise.all([
        supabase
          .from("alunos")
          .select(`
            id,
            nome,
            faixa,
            grau,
            status
          `)
          .eq("status", "ativo")
          .order("nome", {
            ascending: true,
          }),

        supabase
          .from("professores")
          .select(`
            id,
            nome,
            faixa,
            grau,
            funcao
          `)
          .eq("ativo", true)
          .order("nome", {
            ascending: true,
          }),
      ]);

      if (erroAlunos) throw erroAlunos;
      if (erroProfessores) {
        throw erroProfessores;
      }

      setAlunos(alunosData || []);
      setProfessores(
        professoresData || []
      );

      if (
        professoresData?.length === 1
      ) {
        setProfessorId(
          professoresData[0].id
        );
      }
    } catch (error) {
      console.error(
        "Erro ao carregar graduação:",
        error
      );

      alert(
        "Não foi possível carregar os dados da graduação."
      );

      navigate("/graduacoes");
    } finally {
      setLoading(false);
    }
  };

  const alunoSelecionado = useMemo(
    () =>
      alunos.find(
        (aluno) => aluno.id === alunoId
      ) || null,
    [alunos, alunoId]
  );

  useEffect(() => {
    if (!alunoSelecionado) {
      setNovaFaixa("");
      setNovoGrau(0);
      return;
    }

    setNovaFaixa(
      alunoSelecionado.faixa || "Branca"
    );

    setNovoGrau(
      alunoSelecionado.grau ?? 0
    );
  }, [alunoSelecionado]);

  const salvar = async (e) => {
    e.preventDefault();

    if (!alunoId) {
      alert("Selecione o aluno.");
      return;
    }

    if (!novaFaixa.trim()) {
      alert("Informe a nova faixa.");
      return;
    }

    if (
      Number(novoGrau) < 0 ||
      Number(novoGrau) > 10
    ) {
      alert(
        "O grau deve estar entre 0 e 10."
      );
      return;
    }

    if (!professorId) {
      alert(
        "Selecione o professor responsável."
      );
      return;
    }

    const faixaAtual =
      alunoSelecionado?.faixa || "Branca";

    const grauAtual =
      alunoSelecionado?.grau ?? 0;

    if (
      faixaAtual === novaFaixa.trim() &&
      Number(grauAtual) ===
        Number(novoGrau)
    ) {
      alert(
        "A nova graduação deve ser diferente da graduação atual."
      );
      return;
    }

    try {
      setSalvando(true);

      const { error } =
        await supabase.rpc(
          "registrar_graduacao",
          {
            p_aluno_id: alunoId,
            p_nova_faixa:
              novaFaixa.trim(),
            p_novo_grau:
              Number(novoGrau),
            p_data_graduacao:
              dataGraduacao,
            p_professor_id:
              professorId,
            p_observacoes:
              observacoes.trim() ||
              null,
          }
        );

      if (error) throw error;

      alert(
        "Graduação registrada com sucesso!"
      );

      navigate(
        `/alunos/${alunoId}`
      );
    } catch (error) {
      console.error(
        "Erro ao registrar graduação:",
        error
      );

      alert(
        `Erro ao registrar graduação: ${
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
      <div className="page-content">
        Carregando...
      </div>
    );
  }

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <button
            className="back-button"
            onClick={() =>
              navigate("/graduacoes")
            }
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>Nova graduação</h1>

          <p>
            Registre a evolução de faixa ou
            grau do aluno.
          </p>
        </div>
      </header>

      <form
        className="student-form"
        onSubmit={salvar}
      >
        <section className="form-card">
          <div className="form-section-title">
            <h2>Aluno</h2>

            <p>
              Selecione o aluno que será
              graduado.
            </p>
          </div>

          <div className="form-grid">
            <div className="form-field span-2">
              <label>Aluno *</label>

              <select
                value={alunoId}
                onChange={(e) =>
                  setAlunoId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Selecione
                </option>

                {alunos.map((aluno) => (
                  <option
                    key={aluno.id}
                    value={aluno.id}
                  >
                    {aluno.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {alunoSelecionado && (
            <div className="current-graduation-card">
              <Award size={24} />

              <div>
                <span>
                  Graduação atual
                </span>

                <strong>
                  {alunoSelecionado.faixa ||
                    "Branca"}
                  {" • "}
                  {alunoSelecionado.grau ??
                    0}
                  º grau
                </strong>
              </div>
            </div>
          )}
        </section>

        <section className="form-card">
          <div className="form-section-title">
            <h2>Nova graduação</h2>

            <p>
              Informe a nova faixa e/ou grau.
            </p>
          </div>

          <div className="graduation-change-grid">
            <div className="form-field">
              <label>Nova faixa *</label>

              <input
                list="faixas-jiujitsu"
                value={novaFaixa}
                onChange={(e) =>
                  setNovaFaixa(
                    e.target.value
                  )
                }
                placeholder="Ex.: Azul"
              />

              <datalist id="faixas-jiujitsu">
                <option value="Branca" />
                <option value="Cinza" />
                <option value="Amarela" />
                <option value="Laranja" />
                <option value="Verde" />
                <option value="Azul" />
                <option value="Roxa" />
                <option value="Marrom" />
                <option value="Preta" />
                <option value="Coral" />
                <option value="Vermelha" />
              </datalist>
            </div>

            <div className="form-field">
              <label>Novo grau *</label>

              <input
                type="number"
                min="0"
                max="10"
                value={novoGrau}
                onChange={(e) =>
                  setNovoGrau(
                    e.target.value
                  )
                }
              />
            </div>
          </div>

          {alunoSelecionado && (
            <div className="graduation-transition">
              <div>
                <span>De</span>

                <strong>
                  {alunoSelecionado.faixa ||
                    "Branca"}
                  {" • "}
                  {alunoSelecionado.grau ??
                    0}
                  º
                </strong>
              </div>

              <div className="graduation-arrow">
                →
              </div>

              <div>
                <span>Para</span>

                <strong>
                  {novaFaixa || "-"}
                  {" • "}
                  {novoGrau || 0}º
                </strong>
              </div>
            </div>
          )}
        </section>

        <section className="form-card">
          <div className="form-section-title">
            <h2>Registro</h2>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>
                Professor responsável *
              </label>

              <select
                value={professorId}
                onChange={(e) =>
                  setProfessorId(
                    e.target.value
                  )
                }
              >
                <option value="">
                  Selecione
                </option>

                {professores.map(
                  (professor) => (
                    <option
                      key={professor.id}
                      value={professor.id}
                    >
                      {professor.nome}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-field">
              <label>
                Data da graduação *
              </label>

              <input
                type="date"
                value={dataGraduacao}
                onChange={(e) =>
                  setDataGraduacao(
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field span-2">
              <label>Observações</label>

              <textarea
                rows={5}
                value={observacoes}
                onChange={(e) =>
                  setObservacoes(
                    e.target.value
                  )
                }
                placeholder="Observações sobre a graduação..."
              />
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              navigate("/graduacoes")
            }
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={salvando}
          >
            <Save size={18} />

            {salvando
              ? "Salvando..."
              : "Registrar graduação"}
          </button>
        </div>
      </form>
    </div>
  );
}
