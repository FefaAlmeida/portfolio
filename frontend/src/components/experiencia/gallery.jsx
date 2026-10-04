"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { useI18n } from "@/i18n/provider";
import { cn } from "@/lib/utils";

export default function ExperienceGallery({ item }) {
  const { ui } = useI18n();
  const isMatmov = item.id === "exp-03" || /^matmov$/i.test(item.titulo);
  const slides = [
    ...(isMatmov
      ? [{ url: "/matmov.png", alt: ui("Logo do MatMov"), logo: true }]
      : []),
    {
      url: item.imagemUrl,
      alt: item.imagemAlt || ui("Imagem do projeto {0}", { 0: item.titulo }),
    },
    ...(item.imagemDupla &&
    (item.imagemSecundariaId || item.imagemSecundariaUrl)
      ? [
          {
            url:
              item.imagemSecundariaUrl ||
              `/api/media/${item.imagemSecundariaId}`,
            alt:
              item.imagemSecundariaAlt ||
              ui("Outra imagem de {0}", { 0: item.titulo }),
          },
        ]
      : []),
  ];
  const [api, setApi] = useState(null);
  const [paused, setPaused] = useState(true);
  const container = useRef(null);
  const progress = useRef(null);
  const elapsed = useRef(0);

  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPaused(motion.matches);
    update();
    motion.addEventListener("change", update);
    return () => motion.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!api) return;
    function update() {
      elapsed.current = 0;
      if (progress.current) progress.current.style.transform = "scaleX(0)";
    }
    update();
    api.on("select", update);
    api.on("reInit", update);
    return () => {
      api.off("select", update);
      api.off("reInit", update);
    };
  }, [api]);

  useEffect(() => {
    if (!api || paused || slides.length < 2) return;
    let frame = 0;
    let visible = false;
    let started = null;
    function tick(now) {
      if (started !== null) elapsed.current += now - started;
      started = now;
      if (elapsed.current >= 3000) api.scrollNext();
      if (progress.current)
        progress.current.style.transform = `scaleX(${Math.min(elapsed.current / 3000, 1)})`;
      frame = requestAnimationFrame(tick);
    }
    function schedule() {
      cancelAnimationFrame(frame);
      started = null;
      if (visible && !document.hidden) frame = requestAnimationFrame(tick);
    }
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    });
    observer.observe(container.current);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [api, paused, slides.length]);

  function frame(slide) {
    return (
      <div
        className={cn(
          "experience-image-frame relative grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-sm",
          slide.logo && "border border-timeline bg-[#f8f8f6]",
          !isMatmov &&
            item.imagemAjuste === "contain" &&
            "border border-timeline",
        )}
        style={{
          backgroundColor:
            !slide.logo && item.imagemAjuste === "contain"
              ? item.imagemBg
              : undefined,
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: authenticated previews need the media session. */}
        <img
          src={slide.url}
          alt={slide.alt}
          loading="lazy"
          decoding="async"
          className={cn(
            "absolute inset-0 block h-full w-full object-cover",
            (slide.logo || item.imagemAjuste === "contain") &&
              "object-contain p-[15%]",
          )}
        />
      </div>
    );
  }

  return (
    <div ref={container} className="experience-gallery">
      {slides.length === 1 ? (
        frame(slides[0])
      ) : (
        <Carousel
          setApi={setApi}
          opts={{
            loop: true,
            breakpoints: {
              "(prefers-reduced-motion: reduce)": { duration: 0 },
            },
          }}
          tabIndex={0}
          aria-label={ui("Imagens de {0}", { 0: item.titulo })}
        >
          <div className="relative">
            <CarouselContent>
              {slides.map((slide) => (
                <CarouselItem key={slide.url}>{frame(slide)}</CarouselItem>
              ))}
            </CarouselContent>
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[5px] bg-highlight/15"
            >
              <span
                ref={progress}
                className="block size-full origin-left scale-x-0 bg-highlight"
              />
            </div>
            <Button
              variant="brand"
              size="icon"
              className="absolute right-3 bottom-[17px] size-11 rounded-md"
              onClick={() => setPaused((value) => !value)}
              aria-label={ui(
                paused ? "Iniciar troca automática" : "Pausar troca automática",
              )}
            >
              {paused ? (
                <Play aria-hidden="true" className="size-4 fill-current" />
              ) : (
                <Pause aria-hidden="true" className="size-4 fill-current" />
              )}
            </Button>
          </div>
        </Carousel>
      )}
    </div>
  );
}
