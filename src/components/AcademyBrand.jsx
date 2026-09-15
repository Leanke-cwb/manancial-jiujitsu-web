import React, { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { obterUrlLogoAcademia } from "../services/configuracoesAcademia";
import "../styles/academyBrand.css";

export default function AcademyBrand({
  variant = "sidebar",
  showSubtitle = true,
}) {
  const [marca, setMarca] = useState({
    nome_academia: "Manancial Jiu Jitsu",
    logo_path: null,
  });

  const [imagemFalhou, setImagemFalhou] = useState(false);

  useEffect(() => {
    carregarMarca();
  }, []);

  const carregarMarca = async () => {
    try {
      const { data, error } = await supabase.rpc("obter_marca_academia");

      if (error) {
        console.error("Erro ao carregar marca:", error);
        return;
      }

      const dados = Array.isArray(data) ? data[0] : data;

      if (dados) {
        setMarca({
          nome_academia: dados.nome_academia || "Manancial Jiu Jitsu",
          logo_path: dados.logo_path || null,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar marca:", error);
    }
  };

  const logoUrl = marca.logo_path
    ? obterUrlLogoAcademia(marca.logo_path)
    : null;

  const exibirLogo = logoUrl && !imagemFalhou;

  return (
    <div className={`academy-brand academy-brand-${variant}`}>
      <div className="academy-brand-logo-box">
        {exibirLogo ? (
          <img
            src={logoUrl}
            alt={`Logo ${marca.nome_academia}`}
            className="academy-brand-logo"
            onError={() => setImagemFalhou(true)}
          />
        ) : (
          <div className="academy-brand-fallback">MJJ</div>
        )}
      </div>

      <div className="academy-brand-text">
        <strong>{marca.nome_academia}</strong>
        {showSubtitle && <span>Sistema de Gestão</span>}
      </div>
    </div>
  );
}
