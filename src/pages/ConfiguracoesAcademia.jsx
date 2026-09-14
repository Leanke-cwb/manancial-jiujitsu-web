import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  Building2,
  ImagePlus,
  Save,
  Trash2,
} from "lucide-react";

import {
  obterConfiguracoesAcademia,
  salvarConfiguracoesAcademia,
  uploadLogoAcademia,
  removerLogoAcademia,
  obterUrlLogoAcademia,
  validarLogoAcademia,
} from "../services/configuracoesAcademia";

import "../styles/configuracoesAcademia.css";

const ESTADO_INICIAL = {
  nome_academia: "Manancial Jiu Jitsu",
  documento: "",
  telefone: "",
  email: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  responsavel_nome: "",
  pix_chave: "",
  recibo_observacoes: "",
  logo_path: null,
};

export default function ConfiguracoesAcademia() {
  const navigate = useNavigate();

  const [form, setForm] = useState(
    ESTADO_INICIAL
  );

  const [arquivoLogo, setArquivoLogo] =
    useState(null);

  const [previewLocal, setPreviewLocal] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [salvando, setSalvando] =
    useState(false);

  const [removendoLogo, setRemovendoLogo] =
    useState(false);

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    return () => {
      if (previewLocal) {
        URL.revokeObjectURL(
          previewLocal
        );
      }
    };
  }, [previewLocal]);

  const carregar = async () => {
    try {
      setLoading(true);

      const dados =
        await obterConfiguracoesAcademia();

      if (dados) {
        setForm({
          ...ESTADO_INICIAL,
          ...dados,
        });
      }
    } catch (error) {
      console.error(
        "Erro ao carregar configurações:",
        error
      );

      alert(
        `Erro ao carregar configurações: ${
          error.message ||
          "erro desconhecido"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const alterar = (
    campo,
    valor
  ) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const selecionarLogo = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    try {
      validarLogoAcademia(file);

      if (previewLocal) {
        URL.revokeObjectURL(
          previewLocal
        );
      }

      const preview =
        URL.createObjectURL(file);

      setArquivoLogo(file);
      setPreviewLocal(preview);
    } catch (error) {
      event.target.value = "";

      alert(
        error.message ||
          "Arquivo inválido."
      );
    }
  };

  const logoAtual = useMemo(
    () =>
      previewLocal ||
      obterUrlLogoAcademia(
        form.logo_path
      ),
    [
      previewLocal,
      form.logo_path,
    ]
  );

  const removerLogo = async () => {
    if (
      !arquivoLogo &&
      !form.logo_path
    ) {
      return;
    }

    if (
      !window.confirm(
        "Remover o logo da academia?"
      )
    ) {
      return;
    }

    try {
      setRemovendoLogo(true);

      if (form.logo_path) {
        await removerLogoAcademia(
          form.logo_path
        );
      }

      if (previewLocal) {
        URL.revokeObjectURL(
          previewLocal
        );
      }

      setPreviewLocal(null);
      setArquivoLogo(null);

      const dadosAtualizados =
        await salvarConfiguracoesAcademia(
          {
            ...form,
            logo_path: null,
          }
        );

      setForm({
        ...ESTADO_INICIAL,
        ...dadosAtualizados,
      });
    } catch (error) {
      console.error(
        "Erro ao remover logo:",
        error
      );

      alert(
        `Erro ao remover logo: ${
          error.message ||
          "erro desconhecido"
        }`
      );
    } finally {
      setRemovendoLogo(false);
    }
  };

  const salvar = async (
    event
  ) => {
    event.preventDefault();

    if (
      !form.nome_academia.trim()
    ) {
      alert(
        "Informe o nome da academia."
      );
      return;
    }

    try {
      setSalvando(true);

      let logoPath =
        form.logo_path;

      if (arquivoLogo) {
        logoPath =
          await uploadLogoAcademia(
            arquivoLogo
          );
      }

      const dadosAtualizados =
        await salvarConfiguracoesAcademia(
          {
            ...form,
            logo_path:
              logoPath,
          }
        );

      setForm({
        ...ESTADO_INICIAL,
        ...dadosAtualizados,
      });

      setArquivoLogo(null);

      if (previewLocal) {
        URL.revokeObjectURL(
          previewLocal
        );
        setPreviewLocal(null);
      }

      alert(
        "Configurações salvas com sucesso!"
      );
    } catch (error) {
      console.error(
        "Erro ao salvar configurações:",
        error
      );

      alert(
        `Erro ao salvar configurações: ${
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
        Carregando configurações...
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
              navigate(
                "/configuracoes"
              )
            }
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <h1>
            Dados da Academia
          </h1>

          <p>
            Informações institucionais
            utilizadas pelo sistema.
          </p>
        </div>
      </header>

      <form
        className="student-form"
        onSubmit={salvar}
      >
        <section className="form-card">
          <div className="academy-logo-section">
            <div className="academy-logo-preview">
              {logoAtual ? (
                <img
                  src={logoAtual}
                  alt="Logo da academia"
                />
              ) : (
                <Building2
                  size={44}
                />
              )}
            </div>

            <div className="academy-logo-info">
              <h2>
                Identidade visual
              </h2>

              <p>
                JPG, PNG ou WebP,
                até 5 MB.
              </p>

              <div className="academy-logo-actions">
                <label className="btn-secondary academy-file-button">
                  <ImagePlus
                    size={18}
                  />
                  Escolher logo

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={
                      selecionarLogo
                    }
                  />
                </label>

                {(logoAtual ||
                  arquivoLogo) && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={
                      removerLogo
                    }
                    disabled={
                      removendoLogo
                    }
                  >
                    <Trash2
                      size={17}
                    />

                    {removendoLogo
                      ? "Removendo..."
                      : "Remover"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="form-section-title">
            <h2>
              Dados institucionais
            </h2>
          </div>

          <div className="form-grid">
            <div className="form-field span-2">
              <label>
                Nome da academia *
              </label>

              <input
                value={
                  form.nome_academia
                }
                onChange={(e) =>
                  alterar(
                    "nome_academia",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>
                CNPJ / CPF
              </label>

              <input
                value={
                  form.documento
                }
                onChange={(e) =>
                  alterar(
                    "documento",
                    e.target.value
                  )
                }
                placeholder="Documento da academia ou responsável"
              />
            </div>

            <div className="form-field">
              <label>
                Responsável
              </label>

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
          </div>
        </section>

        <section className="form-card">
          <div className="form-section-title">
            <h2>
              Contato
            </h2>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>
                Telefone
              </label>

              <input
                value={
                  form.telefone
                }
                onChange={(e) =>
                  alterar(
                    "telefone",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="form-field">
              <label>
                E-mail
              </label>

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
            <h2>
              Endereço
            </h2>
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
              <label>
                Endereço
              </label>

              <input
                value={
                  form.endereco
                }
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
              <label>
                Complemento
              </label>

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
                placeholder="PR"
              />
            </div>
          </div>
        </section>

        <section className="form-card">
          <div className="form-section-title">
            <h2>
              Financeiro e recibos
            </h2>

            <p>
              Estes dados poderão ser
              reutilizados em recibos e
              relatórios.
            </p>
          </div>

          <div className="form-grid">
            <div className="form-field span-2">
              <label>
                Chave PIX
              </label>

              <input
                value={
                  form.pix_chave
                }
                onChange={(e) =>
                  alterar(
                    "pix_chave",
                    e.target.value
                  )
                }
                placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              />
            </div>

            <div className="form-field span-2">
              <label>
                Observação padrão
                para recibos
              </label>

              <textarea
                rows={5}
                value={
                  form.recibo_observacoes
                }
                onChange={(e) =>
                  alterar(
                    "recibo_observacoes",
                    e.target.value
                  )
                }
                placeholder="Ex.: Agradecemos pela preferência."
              />
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() =>
              navigate(
                "/configuracoes"
              )
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
              : "Salvar configurações"}
          </button>
        </div>
      </form>
    </div>
  );
}
