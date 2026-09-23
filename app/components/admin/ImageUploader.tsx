"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { AnimatePresence, motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function ImageUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const upload = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? "Falha no upload.");
        }

        const { url } = await res.json();
        onChange(url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro inesperado.");
      } finally {
        setUploading(false);
      }
    },
    [onChange],
  );

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    upload(files[0]);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function clear() {
    onChange("");
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <label className="mb-2 block text-[0.6rem] uppercase tracking-[0.35em] text-ink/50">
        Foto do presente
      </label>

      {/* Preview */}
      <AnimatePresence mode="wait" initial={false}>
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-ink/10 bg-cream-dark"
          >
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-cover"
            />

            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-ink/0 transition-colors duration-300 group-hover:bg-ink/50">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="translate-y-3 rounded-full border border-cream/40 bg-cream/10 px-5 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-cream opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-cream/20"
              >
                Trocar
              </button>
              <button
                type="button"
                onClick={clear}
                className="translate-y-3 rounded-full border border-red-300/50 bg-red-500/20 px-5 py-2 text-[0.6rem] uppercase tracking-[0.3em] text-cream opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-red-500/30"
              >
                Remover
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => !uploading && inputRef.current?.click()}
            className={`relative flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed transition-all duration-300 ${
              dragging
                ? "border-gold bg-gold/[0.06]"
                : "border-ink/15 bg-cream hover:border-gold/50 hover:bg-gold/[0.03]"
            } ${uploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {uploading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex flex-col items-center gap-3"
                >
                  <motion.span
                    className="h-8 w-8 rounded-full border-2 border-gold/30 border-t-gold"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <span className="text-[0.65rem] uppercase tracking-[0.3em] text-gold">
                    Enviando…
                  </span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex flex-col items-center gap-3 text-center"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/30 text-gold">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-ink/70">
                      Clique ou arraste uma imagem
                    </p>
                    <p className="mt-1 text-[0.62rem] text-ink/40">
                      JPG, PNG, WEBP ou AVIF · até 5 MB
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Campo de URL manual */}
      <div className="mt-3">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="ou cole uma URL externa…"
          className="w-full rounded-xl border border-ink/10 bg-cream px-4 py-2.5 text-xs text-ink/70 outline-none transition-colors focus:border-gold/60"
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-3 rounded-lg border border-red-500/20 bg-red-500/[0.06] px-4 py-2 text-xs text-red-700"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}