"use client";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export default function ProjectFeatures({ profiles = [] }) {
  const { ui } = useI18n();
  const visible = profiles.filter((profile) => profile.funcionalidades?.length);
  if (!visible.length) return null;
  return (
    <section
      className="project-features mt-8"
      aria-label={ui("Funcionalidades")}
    >
      <div
        className={cn(
          "work-profiles grid grid-cols-1 gap-6",
          visible.length > 1 && "sm:grid-cols-2 sm:gap-x-14",
        )}
      >
        {visible.map((profile) => (
          <section key={profile.categoria}>
            <h4 className="mb-2.5 text-left text-sm leading-normal font-semibold">
              {profile.nome?.trim() ||
                ui(profile.categoria === "admin" ? "Administrador" : "Usuário")}
            </h4>
            <ul className="flex list-disc flex-col gap-1.5 pl-3.5 text-sm leading-[1.85] text-muted-foreground marker:text-[9px]">
              {profile.funcionalidades.map((item, index) => (
                <li className="wrap-anywhere" key={`${index}-${item}`}>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
