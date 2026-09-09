import React, { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

const DIAS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const NOVO_HORARIO = {
  dia_semana: 1,
  horario_inicio: "19:00",
  horario_fim: "20:30",
};

export default function EditarTurma() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    professor_id: "",
    categoria: "",
    capacidade: "",
    ativo: true,
  });

  const [horarios, setHorarios] = useState([]);

  useEffect(() => {
    carregarDados();
  }, [id]);

  const carregarDados = async () => {
    try {
      setLoading(true);

      const [
        { data: professoresData, error: erroProfessores },
        { data: turmaData, error: erroTurma },
        { data: horariosData, error: erroHorarios },
      ] = await Promise.all([
        supabase
          .from("professores")
          .select("id, nome")
          .eq("ativo", true)
          .order("nome", { ascending: true }),

        supabase
          .from("turmas")
          .select("*")
          .eq("id", id)
          .single(),

        supabase
          .from("turma_horarios")
          .select("*")
          .eq("turma_id", id)
          .order("dia_semana", { ascending: true })
          .order("horario_inicio", { ascending: true }),
      ]);

      if (erroProfessores) throw erroProfessores;
      if (erroTurma) throw erroTurma;
      if (erroHorarios) throw erroHorarios;

      setProfessores(professoresData || []);

      setForm({
        nome: turmaData.nome || "",
        descricao: turmaData.descricao || "",
        professor_id: turmaData.professor_id || "",
        categoria: turmaData.categoria || "",
        capacidade: turmaData.capacidade ?? "",
        ativo: turmaData.ativo !== false,
      });

      setHorarios(
        horariosData?.length
          ? horariosData.map((item) => ({
              dia_semana: item.dia_semana,
              horario_inicio:
                item.horario_inicio?.slice(0, 5) || "",
              horario_fim:
                item.horario_fim?.slice(0, 5) || "",
            }))
          : [{ ...NOVO_HORARIO }]
      );
    } catch (error) {
      console.error("Erro ao carregar turma:", error);
      alert("Não foi possível carregar a turma.");
      navigate("/turmas");
    } finally {
      setLoading(false);
    }
  };

  const alterar = (campo, valor) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const alterarHorario = (index, campo, valor) => {
    setHorarios((lista) =>
      lista.map((item, i) =>
        i === index
          ? {
              ...item,
              [campo]:
                campo === "dia_semana" ? Number(valor) : valor,
            }
          : item
      )
    );
  };

  const adicionarHorario = () => {
    setHorarios((lista) => [
      ...lista,
      { ...NOVO_HORARIO },
    ]);
  };

  const removerHorario = (index) => {
    setHorarios((lista) =>
      lista.filter((_, i) => i !== index)
    );
  };

  const validarHorarios = () => {
    for (const horario of horarios) {
      if (!horario.horario_inicio || !horario.horario_fim) {
        return "Preencha o início e o fim de todos os horários.";
      }

      if (horario.horario_inicio >= horario.horario_fim) {
        return "O horário final deve ser posterior ao horário inicial.";
      }
    }

    return null;
  };

  const salvar = async (e) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome da turma.");
      return;
    }

    const erroHorario = validarHorarios();

    if (erroHorario) {
      alert(erroHorario);
      return;
    }

    try {
      setSalvando(true);

      const { error: erroTurma } = await supabase
        .from("turmas")
        .update({
          nome: form.nome.trim(),
          descricao: form.descricao.trim() || null,
          professor_id: form.professor_id || null,
          categoria: form.categoria.trim() || null,
          capacidade:
            form.capacidade === ""
              ? null
              : Number(form.capacidade),
          ativo: form.ativo,
        })
        .eq("id", id);

      if (erroTurma) throw erroTurma;

      const { error: erroExcluir } = await supabase
        .from("turma_horarios")
        .delete()
        .eq("turma_id", id);

      if (erroExcluir) throw erroExcluir;

      const { error: erroInserir } = await supabase
        .from("turma_horarios")
        .insert(
          horarios.map((horario) => ({
            turma_id: id,
            dia_semana: horario.dia_semana,
            horario_inicio: horario.horario_inicio,
            horario_fim: horario.horario_fim,
          }))
        );

      if (erroInserir) throw erroInserir;

      alert("Turma atualizada com sucesso!");
      navigate("/turmas");
    } catch (error) {
      console.error("Erro ao atualizar turma:", error);

      alert(
        `Erro ao atualizar turma: ${
          error.message || "erro desconhecido"
        }`
      );
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        Carregando turma...
      </div>
    );
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

          <h1>Editar turma</h1>
          <p>{form.nome}</p>
        </div>
      </header>

      <form className="student-form" onSubmit={salvar}>
        <section className="form-card">
          <div className="form-section-title">
            <h2>Dados da turma</h2>
          </div>

          <div className="form-grid">
            <div className="form-field span-2">
              <label>Nome *</label>
              <input
                value={form.nome}
                onChange={(e) => alterar("nome", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Categoria</label>
              <input
                value={form.categoria}
                onChange={(e) => alterar("categoria", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label>Professor</label>
              <select
                value={form.professor_id}
                onChange={(e) =>
                  alterar("professor_id", e.target.value)
                }
              >
                <option value="">Sem professor definido</option>

                {professores.map((professor) => (
                  <option
                    key={professor.id}
                    value={professor.id}
                  >
                    {professor.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-field">
              <label>Capacidade</label>
              <input
                type="number"
                min="1"
                value={form.capacidade}
                onChange={(e) =>
                  alterar("capacidade", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label>Status</label>
              <select
                value={form.ativo ? "ativo" : "inativo"}
                onChange={(e) =>
                  alterar("ativo", e.target.value === "ativo")
                }
              >
                <option value="ativo">Ativa</option>
                <option value="inativo">Inativa</option>
              </select>
            </div>

            <div className="form-field span-2">
              <label>Descrição</label>
              <textarea
                rows={4}
                value={form.descricao}
                onChange={(e) =>
                  alterar("descricao", e.target.value)
                }
              />
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="form-section-title schedule-title-row">
            <div>
              <h2>Horários</h2>
              <p>Edite os dias e horários desta turma.</p>
            </div>

            <button
              type="button"
              className="btn-secondary"
              onClick={adicionarHorario}
            >
              <Plus size={17} />
              Adicionar horário
            </button>
          </div>

          <div className="schedule-editor">
            {horarios.map((horario, index) => (
              <div className="schedule-editor-row" key={index}>
                <div className="form-field">
                  <label>Dia</label>

                  <select
                    value={horario.dia_semana}
                    onChange={(e) =>
                      alterarHorario(
                        index,
                        "dia_semana",
                        e.target.value
                      )
                    }
                  >
                    {DIAS.map((dia) => (
                      <option
                        key={dia.value}
                        value={dia.value}
                      >
                        {dia.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field">
                  <label>Início</label>

                  <input
                    type="time"
                    value={horario.horario_inicio}
                    onChange={(e) =>
                      alterarHorario(
                        index,
                        "horario_inicio",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-field">
                  <label>Fim</label>

                  <input
                    type="time"
                    value={horario.horario_fim}
                    onChange={(e) =>
                      alterarHorario(
                        index,
                        "horario_fim",
                        e.target.value
                      )
                    }
                  />
                </div>

                <button
                  type="button"
                  className="schedule-remove-button"
                  title="Remover horário"
                  disabled={horarios.length === 1}
                  onClick={() => removerHorario(index)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => navigate("/turmas")}
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={salvando}
          >
            <Save size={18} />
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}
