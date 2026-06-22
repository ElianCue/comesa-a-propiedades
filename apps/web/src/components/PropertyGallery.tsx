"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  X,
  ImageIcon,
} from "lucide-react";

interface PropertyGalleryProps {
  photos: string[];
  tipo: string;
  barrio: string;
  ciudad: string;
}

export default function PropertyGallery({
  photos,
  tipo,
  barrio,
  ciudad,
}: PropertyGalleryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeIdxRef = useRef(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const allPhotos = photos.filter(Boolean);
  const photoCount = allPhotos.length;

  // ── Carousel ──

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeIdxRef.current) {
      activeIdxRef.current = idx;
      setActiveIdx(idx);
    }
  }, []);

  const scrollTo = useCallback((idx: number) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  }, []);

  const goPrev = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeIdx > 0) scrollTo(activeIdx - 1);
    },
    [activeIdx, scrollTo]
  );

  const goNext = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (activeIdx < photoCount - 1) scrollTo(activeIdx + 1);
    },
    [activeIdx, photoCount, scrollTo]
  );

  // ── Lightbox ──

  const openLightbox = useCallback((idx: number) => {
    setLightboxIdx(idx);
  }, []);

  const lightboxNavigate = useCallback(
    (delta: number) => {
      if (lightboxIdx === null) return;
      const next = lightboxIdx + delta;
      if (next >= 0 && next < photoCount) {
        setLightboxIdx(next);
      }
    },
    [lightboxIdx, photoCount]
  );

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowLeft") lightboxNavigate(-1);
      if (e.key === "ArrowRight") lightboxNavigate(1);
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [lightboxIdx, lightboxNavigate]);

  // ── Desktop thumbnail logic ──

  const maxDesktopThumbs =
    photoCount <= 2 ? photoCount - 1 : photoCount === 4 ? 2 : 3;
  const desktopThumbs = allPhotos.slice(1, maxDesktopThumbs + 1);
  const overlayIdx = maxDesktopThumbs + 1;
  const remainingOffset = photoCount - 1 - maxDesktopThumbs;

  // ── No photos ──

  if (photoCount === 0) {
    return (
      <div className="flex aspect-[21/9] items-center justify-center rounded-2xl bg-muted">
        <div className="text-center">
          <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="mt-2 text-sm text-muted-foreground">Sin fotos</p>
        </div>
      </div>
    );
  }

  const altText = (i: number) =>
    i === 0
      ? `${tipo} en ${barrio}, ${ciudad}`
      : `${tipo} en ${barrio} — foto ${i + 1}`;

  return (
    <>
      {/* ── MOBILE: Horizontal scroll-snap carousel ── */}
      <div className="relative md:hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        >
          {allPhotos.map((f, i) => (
            <div
              key={f}
              className="relative w-full shrink-0 snap-start aspect-[4/3] cursor-pointer overflow-hidden bg-muted"
              onClick={() => openLightbox(i)}
            >
              <img
                src={f}
                alt={altText(i)}
                className="h-full w-full object-cover"
                loading={i === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {/* Counter */}
        <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
          {activeIdx + 1} / {photoCount}
        </div>

        {/* Left arrow */}
        {activeIdx > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg backdrop-blur-sm transition hover:bg-white"
            aria-label="Foto anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Right arrow */}
        {activeIdx < photoCount - 1 && (
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-lg backdrop-blur-sm transition hover:bg-white"
            aria-label="Foto siguiente"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {/* Dots */}
        {photoCount > 1 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
            {allPhotos.map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all ${
                  i === activeIdx
                    ? "h-2 w-4 bg-white"
                    : "h-2 w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── DESKTOP: adaptive mosaic ── */}
      <div
        className="hidden animate-slide-up md:block"
        style={{ height: "500px" }}
      >
        <div
          className={`grid h-full gap-2 ${
            photoCount >= 5
              ? "grid-cols-4 grid-rows-2"
              : photoCount === 4
              ? "grid-cols-4 grid-rows-2"
              : photoCount === 3
              ? "grid-cols-3 grid-rows-2"
              : photoCount === 2
              ? "grid-cols-2 grid-rows-1"
              : "grid-cols-1"
          }`}
        >
          <div
            className={`relative cursor-pointer overflow-hidden rounded-2xl bg-muted ${
              photoCount >= 3 ? "col-span-2 row-span-2" : "col-span-1"
            }`}
            onClick={() => openLightbox(0)}
          >
            <img
              src={allPhotos[0]}
              alt={altText(0)}
              className="h-full w-full object-cover transition duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-1.5 text-[11px] font-medium text-white backdrop-blur-sm">
              <ImageIcon className="h-3.5 w-3.5" />
              {photoCount} fotos
            </div>
          </div>
          {desktopThumbs.map((f, i) => (
            <div
              key={f}
              className="relative cursor-pointer overflow-hidden rounded-2xl bg-muted"
              onClick={() => openLightbox(i + 1)}
            >
              <img
                src={f}
                alt={`${tipo} en ${barrio} — foto ${i + 2}`}
                className="h-full w-full object-cover transition duration-500 hover:scale-105"
                loading="eager"
              />
            </div>
          ))}
          {remainingOffset > 0 && overlayIdx < photoCount && (
            <div
              className="relative cursor-pointer overflow-hidden rounded-2xl bg-muted"
              onClick={() => openLightbox(overlayIdx)}
            >
              <img
                src={allPhotos[overlayIdx]}
                alt=""
                className="h-full w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white backdrop-blur-sm">
                +{remainingOffset}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── LIGHTBOX ── */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg"
          onClick={() => setLightboxIdx(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIdx(null)}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Left arrow */}
          {lightboxIdx > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                lightboxNavigate(-1);
              }}
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <div
            className="relative flex max-h-[85vh] max-w-[85vw] items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={allPhotos[lightboxIdx]}
              alt={`Foto ${lightboxIdx + 1} de ${photoCount}`}
              className="max-h-[85vh] max-w-[85vw] rounded-2xl object-contain shadow-2xl"
            />
          </div>

          {/* Right arrow */}
          {lightboxIdx < photoCount - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                lightboxNavigate(1);
              }}
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Counter */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
            {lightboxIdx + 1} / {photoCount}
          </div>
        </div>
      )}
    </>
  );
}
