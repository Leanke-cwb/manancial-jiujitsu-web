import React, {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  Save,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

export default function EditarAluno() {
  const { id } = useParams();

  const navigate = useNavigate();

  const [loading, setLoading] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [responsavelId, setResponsavelId] =
    useState(null);

  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    data_nascimento: "",
    telefone: "",
    email: "",

    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",

    data_matricula: "",
    status: "ativo",
    faixa: "Branca",
    grau: 0,

    observacoes: "",

    responsavel_nome: "",
    responsavel_cpf: "",
    responsavel_telefone: "",
    responsavel_email: "",
    responsavel_parentesco: "",
  });

  useEffect(() => {
    carregarAluno();
  }, [id]);

  const alterar = (campo, valor) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const carregarAluno = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("alunos")
        .select(`
          *,
          responsaveis (
            id,
            nome,
            cpf,
            telefone,
            email,
            parentesco
          )
        `)
        .eq("id", id)
        .single();

      if (error) {
        throw error;
      }

      const responsavel =
        data.responsaveis;

      setResponsavelId(
        responsavel?.id || null
      );

      setForm({
        nome: data.nome || "",
        cpf: data.cpf || "",

        data_nascimento:
          data.data_nascimento || "",

        telefone: data.telefone || "",
        email: data.email || "",

        cep: data.cep || "",
        endereco: data.endereco || "",
        numero: data.numero || "",

        complemento:
          data.complemento || "",

        bairro: data.bairro || "",
        cidade: data.cidade || "",
        estado: data.estado || "",

        data_matricula:
          data.data_matricula || "",

        status: data.status || "ativo",
        faixa: data.faixa || "Branca",

        grau:
          data.grau !== null
            ? data.grau
            : 0,

        observacoes:
          data.observacoes || "",

        responsavel_nome:
          responsavel?.nome || "",

        responsavel_cpf:
          responsavel?.cpf || "",

        responsavel_telefone:
          responsavel?.telefone || "",

        responsavel_email:
          responsavel?.email || "",

        responsavel_parentesco:
          responsavel?.parentesco || "",
      });
    } catch (error) {
      console.error(
        "Erro ao carregar aluno:",
        error
      );

      alert("Erro ao carregar aluno.");

      navigate("/alunos");
    } finally {
      setLoading(false);
    }
  };

  const salvar = async (e) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome do aluno.");
      return;
    }

    try {
      setSalvando(true);

      let novoResponsavelId =
        responsavelId;

      if (form.responsavel_nome.trim()) {
        const dadosResponsavel = {
          nome:
            form.responsavel_nome.trim(),

          cpf:
            form.responsavel_cpf.trim() ||
            null,

          telefone:
            form.responsavel_telefone.trim() ||
            null,

          email:
            form.responsavel_email.trim() ||
            null,

          parentesco:
            form.responsavel_parentesco.trim() ||
            null,
        };

        if (responsavelId) {
          const { error } = await supabase
            .from("responsaveis")
            .update(dadosResponsavel)
            .eq("id", responsavelId);

          if (error) {
            throw error;
          }
        } else {
          const {
            data,
            error,
          } = await supabase
            .from("responsaveis")
            .insert(dadosResponsavel)
            .select("id")
            .single();

          if (error) {
            throw error;
          }

          novoResponsavelId = data.id;

          setResponsavelId(data.id);
        }
      }

      const { error } = await supabase
        .from("alunos")
        .update({
          nome: form.nome.trim(),

          cpf: form.cpf.trim() || null,

          data_nascimento:
            form.data_nascimento || null,

          telefone:
            form.telefone.trim() || null,

          email:
            form.email.trim() || null,

          cep: form.cep.trim() || null,

          endereco:
            form.endereco.trim() || null,

          numero:
            form.numero.trim() || null,

          complemento:
            form.complemento.trim() ||
            null,

          bairro:
            form.bairro.trim() || null,

          cidade:
            form.cidade.trim() || null,

          estado:
            form.estado.trim() || null,

          data_matricula:
            form.data_matricula || null,

          status: form.status,

          faixa: form.faixa,

          grau: Number(form.grau),

          observacoes:
            form.observacoes.trim() ||
            null,

          responsavel_id:
            novoResponsavelId,
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      alert(
        "Aluno atualizado com sucesso!"
      );

      navigate("/alunos");
    } catch (error) {
      console.error(
        "Erro ao atualizar aluno:",
        error
      );

      alert(
        `Erro ao atualizar aluno: ${
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
        Carregando aluno...
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
              navigate("/alunos")
            }
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>Editar aluno</h1>

          <p>{form.nome}</p>
        </div>
      </header>

      <form
        className="student-form"
        onSubmit={salvar}
      >
        <section className="form-card">
          <div className="form-section-title">
            <h2>Dados pessoais</h2>
          </div>

          <div className="form-grid">
            <div className="form-field span-2">
              <label>Nome *</label>

              <input
                value={form.nome}
                onChange={(e) =>
                  alterar(
                    "nome",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>CPF</label>

              <input
                value={form.cpf}
                onChange={(e) =>
                  alterar(
                    "cpf",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>
                Data de nascimento
              </label>

              <input
                type="date"
                value={
                  form.data_nascimento
                }
                onChange={(e) =>
                  alterar(
                    "data_nascimento",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>Telefone</label>

              <input
                value={form.telefone}
                onChange={(e) =>
                  alterar(
                    "telefone",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>E-mail</label>

              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  alterar(
                    "email",
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="form-section-title">
            <h2>Endereço</h2>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>CEP</label>

              <input
                value={form.cep}
                onChange={(e) =>
                  alterar(
                    "cep",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field span-2">
              <label>Endereço</label>

              <input
                value={form.endereco}
                onChange={(e) =>
                  alterar(
                    "endereco",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>Número</label>

              <input
                value={form.numero}
                onChange={(e) =>
                  alterar(
                    "numero",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>Complemento</label>

              <input
                value={
                  form.complemento
                }
                onChange={(e) =>
                  alterar(
                    "complemento",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>Bairro</label>

              <input
                value={form.bairro}
                onChange={(e) =>
                  alterar(
                    "bairro",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>Cidade</label>

              <input
                value={form.cidade}
                onChange={(e) =>
                  alterar(
                    "cidade",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>Estado</label>

              <input
                maxLength={2}
                value={form.estado}
                onChange={(e) =>
                  alterar(
                    "estado",
                    e.target.value.toUpperCase()
                  )
                }
              />
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="form-section-title">
            <h2>Jiu Jitsu</h2>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>
                Data da matrícula
              </label>

              <input
                type="date"
                value={
                  form.data_matricula
                }
                onChange={(e) =>
                  alterar(
                    "data_matricula",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>Situação</label>

              <select
                value={form.status}
                onChange={(e) =>
                  alterar(
                    "status",
                    e.target.value
                  )
                }
              >
                <option value="ativo">
                  Ativo
                </option>

                <option value="inativo">
                  Inativo
                </option>

                <option value="trancado">
                  Trancado
                </option>

                <option value="visitante">
                  Visitante
                </option>
              </select>
            </div>

            <div className="form-field">
              <label>Faixa</label>

              <select
                value={form.faixa}
                onChange={(e) =>
                  alterar(
                    "faixa",
                    e.target.value
                  )
                }
              >
                <option>Branca</option>
                <option>Cinza</option>
                <option>Amarela</option>
                <option>Laranja</option>
                <option>Verde</option>
                <option>Azul</option>
                <option>Roxa</option>
                <option>Marrom</option>
                <option>Preta</option>
                <option>Coral</option>
                <option>Vermelha</option>
              </select>
            </div>

            <div className="form-field">
              <label>Grau</label>

              <select
                value={form.grau}
                onChange={(e) =>
                  alterar(
                    "grau",
                    e.target.value
                  )
                }
              >
                {Array.from(
                  {
                    length: 11,
                  },
                  (_, i) => (
                    <option
                      key={i}
                      value={i}
                    >
                      {i}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="form-section-title">
            <h2>Responsável</h2>
          </div>

          <div className="form-grid">
            <div className="form-field span-2">
              <label>Nome</label>

              <input
                value={
                  form.responsavel_nome
                }
                onChange={(e) =>
                  alterar(
                    "responsavel_nome",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>CPF</label>

              <input
                value={
                  form.responsavel_cpf
                }
                onChange={(e) =>
                  alterar(
                    "responsavel_cpf",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>Parentesco</label>

              <input
                value={
                  form.responsavel_parentesco
                }
                onChange={(e) =>
                  alterar(
                    "responsavel_parentesco",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>Telefone</label>

              <input
                value={
                  form.responsavel_telefone
                }
                onChange={(e) =>
                  alterar(
                    "responsavel_telefone",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>E-mail</label>

              <input
                value={
                  form.responsavel_email
                }
                onChange={(e) =>
                  alterar(
                    "responsavel_email",
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="form-section-title">
            <h2>Observações</h2>
          </div>

          <div className="form-field">
            <textarea
              rows={5}
              value={form.observacoes}
              onChange={(e) =>
                alterar(
                  "observacoes",
                  e.target.value
                )
              }
            />
          </div>
        </section>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              navigate("/alunos")
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
              : "Salvar alterações"}
          </button>
        </div>
      </form>
    </div>
  );
}