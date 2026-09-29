"use client";

import { useEffect, useRef } from "react";
import { useI18n } from "@/i18n/provider";
import ChipInput from "./chip-input";
import ProjectDates from "./project-dates";
import ProjectMediaEditor from "./project-media";
import ProjectProfiles from "./project-profiles";

const steps = [
  "Sobre o projeto",
  "Perfis e funcionalidades",
  "Mídias e publicação",
];

export function validateProjectForm(
  form,
  draft,
  goTo,
  setError,
  step,
  ui = (text) => text,
) {
  const title = form.querySelector("#titulo");
  title.setCustomValidity(title.value.trim() ? "" : ui("Informe o título."));
  for (const input of form.querySelectorAll("[data-feature-list]")) {
    const items = input.value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    input.setCustomValidity(
      items.length > 60
        ? ui("Use até 60 funcionalidades por perfil.")
        : items.some((item) => item.length > 500)
          ? ui("Cada funcionalidade deve ter até 500 caracteres.")
          : "",
    );
  }
  const sections =
    step === undefined
      ? form.querySelectorAll("[data-project-step]")
      : form.querySelectorAll(`[data-project-step="${step}"]`);
  for (const section of sections) {
    const index = Number(section.dataset.projectStep);
    const invalid = [
      ...section.querySelectorAll("input, select, textarea"),
    ].find((input) => !input.checkValidity());
    if (invalid) {
      goTo(index);
      setError(invalid.validationMessage);
      requestAnimationFrame(() => {
        invalid.focus();
        invalid.reportValidity();
      });
      return false;
    }
    const { inicio, fim } = draft.detalhes;
    if (index === 0 && inicio && fim && fim !== "present" && inicio > fim) {
      goTo(0);
      setError("O fim do projeto deve ser igual ou posterior ao início.");
      return false;
    }
  }
  setError("");
  return true;
}

export default function ProjectEditor({
  draft,
  step,
  setStep,
  selected,
  busy,
  dirty,
  field,
  rich,
  update,
  changeDraft,
  run,
  mutation,
  setNotice,
  setError,
  breakGroup,
}) {
  const { ui } = useI18n();
  const container = useRef(null);
  const editing = Boolean(selected.id);
  useEffect(() => {
    if (editing) return;
    const activeStep = container.current?.querySelector(
      `.project-steps button[data-step="${step}"]`,
    );
    activeStep?.focus({ preventScroll: true });
    container.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }, [step, editing]);
  function goTo(next) {
    breakGroup();
    setStep(next);
  }
  function navigate(next) {
    if (
      next > step &&
      !selected.id &&
      !validateProjectForm(
        container.current.closest("form"),
        draft,
        goTo,
        setError,
        step,
      )
    )
      return;
    goTo(next);
  }

  return (
    <div className="project-wizard" ref={container}>
      {!editing && (
        <nav className="project-steps" aria-label={ui("Etapas do projeto")}>
          {steps.map((label, index) => (
            <button
              type="button"
              key={ui(label)}
              data-step={index}
              aria-current={step === index ? "step" : undefined}
              disabled={busy || (!selected.id && index > step + 1)}
              onClick={() => navigate(index)}
            >
              <span className="project-step-number" aria-hidden="true">
                {index + 1}
              </span>
              <span>{ui(label)}</span>
            </button>
          ))}
        </nav>
      )}
      <section
        data-project-step="0"
        hidden={!editing && step !== 0}
        aria-labelledby={editing ? "project-section-about" : undefined}
        className="project-step-content"
      >
        {editing && (
          <h2 id="project-section-about" className="project-section-heading">
            <span className="project-step-number" aria-hidden="true">
              1
            </span>
            {ui(steps[0])}
          </h2>
        )}
        {field("titulo", ui("Título"), { required: true, maxLength: 160 })}
        {field("subtitulo", ui("Subtítulo"))}
        {field("tipo", ui("Tipo de projeto"), { details: true })}
        <label className="admin-field" htmlFor="tagDireita">
          <span>{ui("Status do projeto")}</span>
          <select
            id="tagDireita"
            value={draft.tagDireita}
            onChange={(event) => update("tagDireita", event.target.value)}
            required
          >
            <option value="EM DESENVOLVIMENTO">
              {ui("Em Desenvolvimento")}
            </option>
            <option value="FINALIZADO">{ui("Concluído")}</option>
          </select>
        </label>
        <ProjectDates
          status={draft.tagDireita}
          value={draft.detalhes}
          disabled={busy}
          onChange={(value) => update("detalhes", value)}
        />
        {rich("descricao", ui("Descrição"))}
      </section>
      <section
        data-project-step="1"
        hidden={!editing && step !== 1}
        aria-labelledby={editing ? "project-section-profiles" : undefined}
        className="project-step-content"
      >
        {editing && (
          <h2 id="project-section-profiles" className="project-section-heading">
            <span className="project-step-number" aria-hidden="true">
              2
            </span>
            {ui(steps[1])}
          </h2>
        )}
        <ProjectProfiles draft={draft} changeDraft={changeDraft} />
      </section>
      <section
        data-project-step="2"
        hidden={!editing && step !== 2}
        aria-labelledby={editing ? "project-section-media" : undefined}
        className="project-step-content"
      >
        {editing && (
          <h2 id="project-section-media" className="project-section-heading">
            <span className="project-step-number" aria-hidden="true">
              3
            </span>
            {ui(steps[2])}
          </h2>
        )}
        <ProjectMediaEditor
          draft={draft}
          disabled={busy}
          changeDraft={changeDraft}
          run={run}
          mutation={mutation}
          onNotice={setNotice}
        />
        <ChipInput
          label={ui("Tecnologias")}
          value={draft.tecnologias}
          onChange={(value) => update("tecnologias", value)}
          disabled={busy}
        />
        <div className="field-grid">
          {field("linkDeploy", ui("Link do projeto"), {
            type: "url",
            maxLength: 2048,
          })}
          {field("linkGithub", ui("Link do código"), {
            type: "url",
            maxLength: 2048,
          })}
        </div>
        <label className="admin-field" htmlFor="visibilidade">
          <span>{ui("Visibilidade")}</span>
          <select
            id="visibilidade"
            value={draft.visibilidade}
            onChange={(event) => update("visibilidade", event.target.value)}
          >
            <option value="publico">{ui("Público")}</option>
            <option value="privado">{ui("Privado")}</option>
          </select>
        </label>
      </section>
      <div className="project-step-actions">
        {!editing && (
          <button
            type="button"
            disabled={busy || step === 0}
            onClick={() => navigate(step - 1)}
          >
            {ui("Anterior")}
          </button>
        )}
        {!editing && step < 2 ? (
          <button
            key="next"
            type="button"
            className="primary"
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              navigate(step + 1);
            }}
          >
            {ui("Próximo")}
          </button>
        ) : (
          <button
            key="save"
            type="submit"
            className="primary"
            disabled={busy || !dirty}
          >
            {ui("Salvar projeto")}
          </button>
        )}
      </div>
    </div>
  );
}
