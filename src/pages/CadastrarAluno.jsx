import React, {
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Save,
} from "lucide-react";

import { supabase } from "../services/supabaseClient";

import {
  removerFotoAluno,
  uploadFotoAluno,
  validarFotoAluno,
} from "../services/fotoAluno";

const FORM_INICIAL = {
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

  data_matricula:
    new Date().toISOString().split("T")[0],

  status: "ativo",
  faixa: "Branca",
  grau: 0,

  observacoes: "",

  responsavel_nome: "",
  responsavel_cpf: "",
  responsavel_telefone: "",
  responsavel_email: "",
  responsavel_parentesco: "",
};

export default function CadastrarAluno() {
  const navigate = useNavigate();

  const [form, setForm] =
    useState(FORM_INICIAL);

  const [salvando, setSalvando] =
    useState(false);

  const [foto, setFoto] =
    useState(null);

  const [fotoPreview, setFotoPreview] =
    useState(null);

  useEffect(() => {
    if (!foto) {
      setFotoPreview(null);
      return;
    }

    const url = URL.createObjectURL(foto);

    setFotoPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [foto]);

  const alterar = (campo, valor) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const selecionarFoto = (event) => {
    const arquivo =
      event.target.files?.[0];

    if (!arquivo) return;

    try {
      validarFotoAluno(arquivo);
      setFoto(arquivo);
    } catch (error) {
      alert(error.message);
      event.target.value = "";
    }
  };

  const salvar = async (e) => {
    e.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome do aluno.");
      return;
    }

    const alunoId = crypto.randomUUID();

    let fotoPath = null;
    let responsavelId = null;

    try {
      setSalvando(true);

      if (foto) {
        fotoPath = await uploadFotoAluno(
          alunoId,
          foto
        );
      }

      if (form.responsavel_nome.trim()) {
        const {
          data: responsavel,
          error: erroResponsavel,
        } = await supabase
          .from("responsaveis")
          .insert({
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
          })
          .select("id")
          .single();

        if (erroResponsavel) {
          throw erroResponsavel;
        }

        responsavelId = responsavel.id;
      }

      const { error: erroAluno } = await supabase
        .from("alunos")
        .insert({
          id: alunoId,
          foto_url: fotoPath,

          nome: form.nome.trim(),
          cpf: form.cpf.trim() || null,

          data_nascimento:
            form.data_nascimento || null,

          telefone:
            form.telefone.trim() || null,

          email:
            form.email.trim() || null,

          cep:
            form.cep.trim() || null,

          endereco:
            form.endereco.trim() || null,

          numero:
            form.numero.trim() || null,

          complemento:
            form.complemento.trim() || null,

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
            form.observacoes.trim() || null,

          responsavel_id:
            responsavelId,
        });

      if (erroAluno) {
        throw erroAluno;
      }

      alert("Aluno cadastrado com sucesso!");
      navigate("/alunos");
    } catch (error) {
      if (fotoPath) {
        try {
          await removerFotoAluno(fotoPath);
        } catch (erroRemocao) {
          console.error(
            "Erro ao limpar foto:",
            erroRemocao
          );
        }
      }

      console.error(
        "Erro ao cadastrar aluno:",
        error
      );

      alert(
        `Erro ao cadastrar aluno: ${
          error.message || "erro desconhecido"
        }`
      );
    } finally {
      setSalvando(false);
    }
  };

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

          <h1>Novo aluno</h1>

          <p>
            Cadastre um novo aluno da Manancial
            Jiu Jitsu.
          </p>
        </div>
      </header>

      <form
        className="student-form"
        onSubmit={salvar}
      >
        <section className="form-card">
          <div className="form-section-title">
            <h2>Foto do aluno</h2>

            <p>
              Utilize uma foto de rosto para
              identificação.
            </p>
          </div>

          <div className="student-photo-editor">
            <div className="student-photo-preview">
              {fotoPreview ? (
                <img
                  src={fotoPreview}
                  alt="Foto do aluno"
                />
              ) : (
                <div className="student-photo-placeholder">
                  FOTO
                </div>
              )}
            </div>

            <div className="photo-input-area">
              <label className="btn-secondary photo-button">
                Selecionar foto

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={selecionarFoto}
                  hidden
                />
              </label>

              <span>
                JPG, PNG ou WebP • máximo 5 MB
              </span>

              {foto && (
                <button
                  type="button"
                  className="photo-remove-button"
                  onClick={() =>
                    setFoto(null)
                  }
                >
                  Remover foto selecionada
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="form-section-title">
            <h2>Dados pessoais</h2>
            <p>Informações principais do aluno.</p>
          </div>

          <div className="form-grid">
            <div className="form-field span-2">
              <label>Nome completo *</label>

              <input
                value={form.nome}
                onChange={(e) =>
                  alterar("nome", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label>CPF</label>

              <input
                value={form.cpf}
                onChange={(e) =>
                  alterar("cpf", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label>Data de nascimento</label>

              <input
                type="date"
                value={form.data_nascimento}
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
                  alterar("email", e.target.value)
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
                  alterar("cep", e.target.value)
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
                  alterar("numero", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label>Complemento</label>

              <input
                value={form.complemento}
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
                  alterar("bairro", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label>Cidade</label>

              <input
                value={form.cidade}
                onChange={(e) =>
                  alterar("cidade", e.target.value)
                }
              />
            </div>

            <div className="form-field">
              <label>Estado</label>

              <input
                maxLength={2}
                placeholder="PR"
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

            <p>
              Matrícula e graduação atual.
            </p>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>Data da matrícula</label>

              <input
                type="date"
                value={form.data_matricula}
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
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="trancado">Trancado</option>
                <option value="visitante">Visitante</option>
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
                  { length: 11 },
                  (_, i) => (
                    <option key={i} value={i}>
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

            <p>
              Preencha quando necessário,
              principalmente para alunos menores.
            </p>
          </div>

          <div className="form-grid">
            <div className="form-field span-2">
              <label>Nome do responsável</label>

              <input
                value={form.responsavel_nome}
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
                value={form.responsavel_cpf}
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
                placeholder="Pai, mãe..."
                value={form.responsavel_parentesco}
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
                value={form.responsavel_telefone}
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
                type="email"
                value={form.responsavel_email}
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
              : "Salvar aluno"}
          </button>
        </div>
      </form>
    </div>
  );
}
