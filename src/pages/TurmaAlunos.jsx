import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Search, UserPlus, UserMinus } from "lucide-react";
import { supabase } from "../services/supabaseClient";

export default function TurmaAlunos() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [turma, setTurma] = useState(null);
  const [alunos, setAlunos] = useState([]);
  const [vinculos, setVinculos] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvandoId, setSalvandoId] = useState(null);

  useEffect(() => {
    carregar();
  }, [id]);

  const carregar = async () => {
    try {
      setLoading(true);

      const [
        { data: turmaData, error: erroTurma },
        { data: alunosData, error: erroAlunos },
        { data: vinculosData, error: erroVinculos },
      ] = await Promise.all([
        supabase
          .from("turmas")
          .select(`
            id,
            nome,
            categoria,
            capacidade,
            professores (nome)
          `)
          .eq("id", id)
          .single(),

        supabase
          .from("alunos")
          .select(`
            id,
            nome,
            faixa,
            grau,
            telefone,
            status
          `)
          .eq("status", "ativo")
          .order("nome", { ascending: true }),

        supabase
          .from("turma_alunos")
          .select("id, turma_id, aluno_id, ativo")
          .eq("turma_id", id),
      ]);

      if (erroTurma) throw erroTurma;
      if (erroAlunos) throw erroAlunos;
      if (erroVinculos) throw erroVinculos;

      setTurma(turmaData);
      setAlunos(alunosData || []);
      setVinculos(vinculosData || []);
    } catch (error) {
      console.error("Erro ao carregar alunos da turma:", error);
      alert("Não foi possível carregar os alunos da turma.");
      navigate("/turmas");
    } finally {
      setLoading(false);
    }
  };

  const vinculoPorAluno = useMemo(() => {
    const mapa = new Map();

    for (const vinculo of vinculos) {
      mapa.set(vinculo.aluno_id, vinculo);
    }

    return mapa;
  }, [vinculos]);

  const ativosNaTurma = useMemo(
    () => vinculos.filter((vinculo) => vinculo.ativo).length,
    [vinculos]
  );

  const lista = useMemo(() => {
    const texto = pesquisa.trim().toLowerCase();

    if (!texto) return alunos;

    return alunos.filter(
      (aluno) =>
        aluno.nome?.toLowerCase().includes(texto) ||
        aluno.telefone?.toLowerCase().includes(texto) ||
        aluno.faixa?.toLowerCase().includes(texto)
    );
  }, [alunos, pesquisa]);

  const alterarVinculo = async (aluno) => {
    const vinculoAtual = vinculoPorAluno.get(aluno.id);
    const estaAtivo = vinculoAtual?.ativo === true;

    if (
      !estaAtivo &&
      turma?.capacidade &&
      ativosNaTurma >= Number(turma.capacidade)
    ) {
      alert(
        `A turma atingiu a capacidade máxima de ${turma.capacidade} alunos.`
      );
      return;
    }

    try {
      setSalvandoId(aluno.id);

      if (vinculoAtual) {
        const { error } = await supabase
          .from("turma_alunos")
          .update({ ativo: !estaAtivo })
          .eq("id", vinculoAtual.id);

        if (error) throw error;

        setVinculos((listaAtual) =>
          listaAtual.map((item) =>
            item.id === vinculoAtual.id
              ? { ...item, ativo: !estaAtivo }
              : item
          )
        );

        return;
      }

      const { data, error } = await supabase
        .from("turma_alunos")
        .insert({
          turma_id: id,
          aluno_id: aluno.id,
          ativo: true,
        })
        .select("id, turma_id, aluno_id, ativo")
        .single();

      if (error) throw error;

      setVinculos((listaAtual) => [...listaAtual, data]);
    } catch (error) {
      console.error("Erro ao alterar vínculo:", error);

      alert(
        `Erro ao alterar vínculo: ${
          error.message || "erro desconhecido"
        }`
      );
    } finally {
      setSalvandoId(null);
    }
  };

  if (loading) {
    return <div className="page-content">Carregando turma...</div>;
  }

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <button
            className="back-button"
            onClick={() => navigate("/turmas")}
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>Alunos da turma</h1>

          <p>
            {turma?.nome}
            {turma?.professores?.nome
              ? ` • ${turma.professores.nome}`
              : ""}
          </p>
        </div>
      </header>

      <div className="class-members-summary">
        <div>
          <span>Alunos vinculados</span>
          <strong>{ativosNaTurma}</strong>
        </div>

        <div>
          <span>Capacidade</span>
          <strong>{turma?.capacidade || "Sem limite"}</strong>
        </div>

        <div>
          <span>Categoria</span>
          <strong>{turma?.categoria || "-"}</strong>
        </div>
      </div>

      <section className="content-card">
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} />
            <input
              placeholder="Pesquisar aluno..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>
        </div>

        {lista.length === 0 ? (
          <div className="empty-state">
            Nenhum aluno ativo encontrado.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Graduação</th>
                  <th>Telefone</th>
                  <th>Na turma</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {lista.map((aluno) => {
                  const vinculo = vinculoPorAluno.get(aluno.id);
                  const ativo = vinculo?.ativo === true;

                  return (
                    <tr key={aluno.id}>
                      <td>
                        <button
                          className="student-name-link"
                          onClick={() =>
                            navigate(`/alunos/${aluno.id}`)
                          }
                        >
                          {aluno.nome}
                        </button>
                      </td>

                      <td>
                        {aluno.faixa || "-"} • {aluno.grau ?? 0}º grau
                      </td>

                      <td>{aluno.telefone || "-"}</td>

                      <td>
                        <span
                          className={`status-badge ${
                            ativo
                              ? "status-ativo"
                              : "status-inativo"
                          }`}
                        >
                          {ativo
                            ? "Vinculado"
                            : "Não vinculado"}
                        </span>
                      </td>

                      <td>
                        <button
                          className={
                            ativo
                              ? "btn-table-danger"
                              : "btn-table-primary"
                          }
                          disabled={salvandoId === aluno.id}
                          onClick={() => alterarVinculo(aluno)}
                        >
                          {ativo ? (
                            <>
                              <UserMinus size={16} />
                              Remover
                            </>
                          ) : (
                            <>
                              <UserPlus size={16} />
                              Vincular
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
