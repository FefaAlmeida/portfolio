"use client";
import { useI18n } from "@/i18n/provider";

export const profileNames = { admin: "Administrador", usuario: "Usuário" };

// Kept in draft history, but never sent to the API or the preview.
export function projectPayload(draft) {
  const { _inactiveProfiles, ...payload } = draft;
  return payload;
}

export default function ProjectProfiles({ draft, changeDraft }) {
  const { ui } = useI18n();
  const profiles = draft.detalhes.perfis || [];
  const selection =
    profiles.length === 2 ? "ambos" : profiles[0]?.categoria || "";

  function select(value) {
    const categories = value === "ambos" ? ["admin", "usuario"] : [value];
    changeDraft((old) => {
      const cache = { ...old._inactiveProfiles };
      for (const profile of old.detalhes.perfis || [])
        cache[profile.categoria] = profile;
      const perfis = categories.map((categoria) => {
        const profile = cache[categoria] || {
          categoria,
          nome: "",
          funcionalidades: [],
        };
        delete cache[categoria];
        return profile;
      });
      return {
        ...old,
        _inactiveProfiles: cache,
        detalhes: { ...old.detalhes, perfis },
      };
    });
  }

  function update(category, key, value) {
    changeDraft(
      (old) => ({
        ...old,
        detalhes: {
          ...old.detalhes,
          perfis: old.detalhes.perfis.map((profile) =>
            profile.categoria === category
              ? { ...profile, [key]: value }
              : profile,
          ),
        },
      }),
      `perfil-${category}-${key}`,
    );
  }

  return (
    <>
      <label className="admin-field" htmlFor="project-profiles">
        <span>{ui("Quais perfis a aplicação tem?")}</span>
        <select
          id="project-profiles"
          value={selection}
          onChange={(event) => select(event.target.value)}
        >
          {!selection && (
            <option value="" disabled>
              {ui("Perfis ainda não definidos")}
            </option>
          )}
          <option value="usuario">{ui("Só usuário")}</option>
          <option value="admin">{ui("Só administrador")}</option>
          <option value="ambos">{ui("Administrador e usuário")}</option>
        </select>
      </label>
      <p className="field-hint">
        {ui(
          "Use até dois perfis e dê a cada um o nome usado no projeto. As funcionalidades são opcionais, com um item por linha.",
        )}
      </p>
      {draft.detalhes.tiposUsuarios?.length > 0 && (
        <p className="field-hint">
          {ui("Nomes do cadastro anterior para consulta:")}{" "}
          {draft.detalhes.tiposUsuarios.join("; ")}.
        </p>
      )}
      <div className="project-profile-grid">
        {profiles.map((profile) => (
          <section
            key={profile.categoria}
            className="project-profile"
            aria-label={ui("Perfil {0}", {
              0: ui(profileNames[profile.categoria]),
            })}
          >
            <h3>{ui(profileNames[profile.categoria])}</h3>
            <label
              className="admin-field"
              htmlFor={`profile-name-${profile.categoria}`}
            >
              <span id={`profile-name-label-${profile.categoria}`}>
                {ui("Nome do")}{" "}
                {ui(profileNames[profile.categoria]).toLowerCase()}
              </span>
              <input
                id={`profile-name-${profile.categoria}`}
                aria-labelledby={`profile-name-label-${profile.categoria}`}
                aria-describedby={`profile-name-hint-${profile.categoria}`}
                value={profile.nome}
                maxLength={500}
                placeholder={
                  profile.categoria === "admin"
                    ? ui("Ex.: Bibliotecário")
                    : ui("Ex.: Leitor")
                }
                onChange={(event) =>
                  update(profile.categoria, "nome", event.target.value)
                }
              />
              <small id={`profile-name-hint-${profile.categoria}`}>
                {ui("Se ficar vazio, será usado “")}
                {ui(profileNames[profile.categoria])}”.
              </small>
            </label>
            <label
              className="admin-field"
              htmlFor={`profile-features-${profile.categoria}`}
            >
              <span>
                {ui("Funcionalidades do")}{" "}
                {ui(profileNames[profile.categoria]).toLowerCase()}
              </span>
              <textarea
                id={`profile-features-${profile.categoria}`}
                rows={6}
                data-feature-list
                value={profile.funcionalidades.join("\n")}
                placeholder={
                  profile.categoria === "admin"
                    ? ui("Cadastrar e organizar livros\nGerenciar empréstimos")
                    : ui("Consultar o catálogo\nSolicitar empréstimos")
                }
                onChange={(event) =>
                  update(
                    profile.categoria,
                    "funcionalidades",
                    event.target.value.split("\n"),
                  )
                }
              />
            </label>
          </section>
        ))}
      </div>
    </>
  );
}
