"use client";
import { Maximize, Minimize } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
} from "@/components/ui/carousel";
import { useI18n } from "@/i18n/provider";
import { projectCover } from "@/lib/project-media";
import { cn } from "@/lib/utils";

function ImageNavigation({ count }) {
  const { ui } = useI18n();
  const { api } = useCarousel();
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (!api) return;
    const update = () => setSelected(api.selectedScrollSnap());
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  return (
    <>
      {count > 1 && (
        <CarouselPrevious
          variant="default"
          className="work-gallery-previous top-[calc((100cqw*9/16-44px)/2)] bottom-auto left-2 my-0 size-11 sm:left-3.5"
          aria-label={ui("Imagem anterior")}
        />
      )}
      <output
        className="work-media-count pointer-events-none absolute top-[calc(100cqw*9/16-48px)] left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/50 px-3.5 py-1.5 text-[13px] text-white tabular-nums backdrop-blur-md"
        aria-live="polite"
        aria-label={ui("{0} de {1}", { 0: selected + 1, 1: count })}
      >
        {selected + 1}/{count}
      </output>
      {count > 1 && (
        <CarouselNext
          variant="default"
          className="work-gallery-next top-[calc((100cqw*9/16-44px)/2)] right-2 bottom-auto my-0 size-11 sm:right-3.5"
          aria-label={ui("Próxima imagem")}
        />
      )}
    </>
  );
}

function ProjectVideo({ media, title }) {
  const { ui } = useI18n();
  const container = useRef(null);
  const video = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const element = video.current;
    let disposed = false;
    const play = () => {
      if (disposed || !element.paused) return;
      element.muted = true;
      element.play().catch(() => {});
    };
    play();
    document.addEventListener("pointerup", play);
    document.addEventListener("keydown", play);
    return () => {
      disposed = true;
      element.pause();
      document.removeEventListener("pointerup", play);
      document.removeEventListener("keydown", play);
    };
  }, []);
  useEffect(() => {
    const change = () =>
      setFullscreen(document.fullscreenElement === container.current);
    document.addEventListener("fullscreenchange", change);
    return () => document.removeEventListener("fullscreenchange", change);
  }, []);
  useEffect(() => {
    const dialog = container.current.closest('[data-slot="dialog-content"]');
    if (expanded) dialog?.setAttribute("data-video-expanded", "true");
    function exitOnEscape(event) {
      if (
        event.key !== "Escape" ||
        (!expanded && document.fullscreenElement !== container.current)
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setExpanded(false);
    }
    document.addEventListener("keydown", exitOnEscape, true);
    return () => {
      dialog?.removeAttribute("data-video-expanded");
      document.removeEventListener("keydown", exitOnEscape, true);
    };
  }, [expanded]);
  async function toggleFullscreen() {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (document.fullscreenElement === container.current) {
      await document.exitFullscreen().catch(() => {});
      return;
    }
    try {
      if (!container.current.requestFullscreen)
        throw new Error("Fullscreen unavailable");
      await container.current.requestFullscreen();
    } catch {
      setExpanded(true);
    }
  }
  return (
    <div
      ref={container}
      className={cn(
        "project-video relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-black text-white [&:fullscreen]:m-0 [&:fullscreen]:h-dvh [&:fullscreen]:w-screen [&:fullscreen]:rounded-none",
        expanded &&
          "project-video-expanded fixed inset-0 z-40 m-0 h-full rounded-none",
      )}
    >
      <video
        className="pointer-events-none size-full object-contain"
        ref={video}
        src={media.url}
        poster={media.previewUrl}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        disableRemotePlayback
        aria-label={media.alt || ui("Demonstração de {0}", { 0: title })}
        onError={() => setFailed(true)}
      />
      {failed && (
        <output className="project-video-error absolute top-4 rounded-lg bg-black/75 px-4 py-2.5 text-sm text-white">
          {ui("Não foi possível reproduzir este vídeo.")}
        </output>
      )}
      {media.legenda && (
        <p className="absolute top-2 left-2 max-w-[calc(100%-1rem)] rounded bg-black/70 p-2 text-sm">
          {media.legenda}
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        className="project-fullscreen-button absolute right-3 bottom-3 size-11 border-white/30 bg-black/60 p-0 text-white hover:bg-black/80 hover:text-white dark:bg-black/60"
        onClick={toggleFullscreen}
        aria-label={
          expanded || fullscreen ? ui("Sair da tela cheia") : ui("Tela cheia")
        }
      >
        {expanded || fullscreen ? (
          <Minimize size={20} aria-hidden="true" />
        ) : (
          <Maximize size={20} aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}

export default function ProjectMedia({ project }) {
  const { ui } = useI18n();
  const cover = projectCover(project);
  const media = project.midias?.length
    ? project.midias
    : cover.url
      ? [
          {
            assetId: project.capaId || "cover",
            url: cover.url,
            alt: cover.alt || ui("Capa de {0}", { 0: project.titulo }),
            corFundo: cover.color,
          },
        ]
      : [];
  const video = media.find((item) => item.tipo === "video");
  if (video)
    return (
      <ProjectVideo key={video.assetId} media={video} title={project.titulo} />
    );
  if (!media.length) return null;
  return (
    <Carousel
      opts={{
        loop: false,
        breakpoints: { "(prefers-reduced-motion: reduce)": { duration: 0 } },
      }}
      className="work-media relative [container-type:inline-size]"
      aria-label={ui("Imagens de {0}", { 0: project.titulo })}
    >
      <CarouselContent>
        {media.map((item, index) => (
          <CarouselItem key={item.assetId}>
            <div
              className="work-media-frame flex aspect-video w-full items-center justify-center overflow-hidden rounded-[14px]"
              style={{
                backgroundColor:
                  item.corFundo || item.corAutomatica || "#f4eee1",
              }}
            >
              {/* biome-ignore lint/performance/noImgElement: authenticated previews share the same component. */}
              <img
                src={item.url}
                alt={
                  item.alt ||
                  (item.assetId === project.capaId
                    ? ui("Capa de {0}", { 0: project.titulo })
                    : ui("{0} — tela {1}", { 0: project.titulo, 1: index + 1 }))
                }
                className="h-full w-full object-contain"
              />
            </div>
            {item.legenda && (
              <p className="mt-2 text-sm text-center">{item.legenda}</p>
            )}
          </CarouselItem>
        ))}
      </CarouselContent>
      <ImageNavigation count={media.length} />
    </Carousel>
  );
}
