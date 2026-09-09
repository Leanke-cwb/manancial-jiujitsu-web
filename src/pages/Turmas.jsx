import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Pencil,
  Clock3,
  Users,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

const DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

export default function Turmas() {
  const navigate = useNavigate();

  const [turmas, setTurmas] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [filtro, setFiltro] = useState("ativas");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarTurmas();
  }, []);

  const carregarTurmas = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("turmas")
        .select(`
          *,
          professores (
            id,
            nome
          ),
          turma_horarios (
            id,
            dia_semana,
            horario_inicio,
            horario_fim
          )
        `)
        .order("ativo", { ascending: false })
        .order("nome", { ascending: true });

      if (error) throw error;

      setTurmas(data || []);
    } catch (error) {
      console.error("Erro ao carregar turmas:", error);
      alert("Não foi possível carregar as turmas.");
    } finally {
      setLoading(false);
    }
  };

  const lista = useMemo(() => {
    const texto = pesquisa.trim().toLowerCase();

    return turmas.filter((turma) => {
      const filtroOk =
        filtro === "todas" ||
        (filtro === "ativas" && turma.ativo) ||
        (filtro === "inativas" && !turma.ativo);

      const pesquisaOk =
        !texto ||
        turma.nome?.toLowerCase().includes(texto) ||
        turma.categoria?.toLowerCase().includes(texto) ||
        turma.professores?.nome?.toLowerCase().includes(texto);

      return filtroOk && pesquisaOk;
    });
  }, [turmas, pesquisa, filtro]);

  const horariosOrdenados = (horarios = []) =>
    [...horarios].sort((a, b) => {
      if (a.dia_semana !== b.dia_semana) {
        return a.dia_semana - b.dia_semana;
      }

      return String(a.horario_inicio).localeCompare(
        String(b.horario_inicio)
      );
    });

  return (
    <div className="page-content">
      <header className="page-header">
        <div>
          <h1>Turmas</h1>
          <p>Turmas, professores e horários da academia.</p>
        </div>

        <button
          className="btn-primary"
          onClick={() => navigate("/turmas/nova")}
        >
          <Plus size={18} />
          Nova turma
        </button>
      </header>

      <section className="content-card">
        <div className="filters-row">
          <div className="search-box">
            <Search size={18} />

            <input
              placeholder="Pesquisar turma..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          >
            <option value="ativas">Ativas</option>
            <option value="inativas">Inativas</option>
            <option value="todas">Todas</option>
          </select>
        </div>

        {loading ? (
          <div className="table-message">Carregando turmas...</div>
        ) : lista.length === 0 ? (
          <div className="empty-state">
            Nenhuma turma encontrada.
          </div>
        ) : (
          <div className="classes-grid">
            {lista.map((turma) => (
              <article className="class-card" key={turma.id}>
                <div className="class-card-header">
                  <div>
                    <h2>{turma.nome}</h2>

                    <span
                      className={`status-badge ${
                        turma.ativo
                          ? "status-ativo"
                          : "status-inativo"
                      }`}
                    >
                      {turma.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </div>

                  <div className="class-card-actions">
                    <button
                      className="btn-table-primary"
                      onClick={() =>
                        navigate(`/turmas/${turma.id}/alunos`)
                      }
                    >
                      <Users size={16} />
                      Alunos
                    </button>

                    <button
                      className="icon-button"
                      title="Editar turma"
                      onClick={() =>
                        navigate(`/turmas/${turma.id}/editar`)
                      }
                    >
                      <Pencil size={17} />
                    </button>
                  </div>
                </div>

                <div className="class-card-info">
                  <div>
                    <span>Categoria</span>
                    <strong>{turma.categoria || "-"}</strong>
                  </div>

                  <div>
                    <span>Professor</span>
                    <strong>
                      {turma.professores?.nome || "Não definido"}
                    </strong>
                  </div>

                  <div>
                    <span>Capacidade</span>
                    <strong>
                      {turma.capacidade || "Sem limite"}
                    </strong>
                  </div>
                </div>

                <div className="class-schedule">
                  <div className="class-schedule-title">
                    <Clock3 size={16} />
                    <strong>Horários</strong>
                  </div>

                  {turma.turma_horarios?.length ? (
                    horariosOrdenados(turma.turma_horarios).map(
                      (horario) => (
                        <div
                          className="class-schedule-row"
                          key={horario.id}
                        >
                          <span>{DIAS[horario.dia_semana]}</span>

                          <strong>
                            {horario.horario_inicio?.slice(0, 5)}
                            {" - "}
                            {horario.horario_fim?.slice(0, 5)}
                          </strong>
                        </div>
                      )
                    )
                  ) : (
                    <span className="empty-inline">
                      Nenhum horário cadastrado.
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
