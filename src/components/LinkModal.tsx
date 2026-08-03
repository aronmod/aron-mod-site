import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type LinkModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function LinkModal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: LinkModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!nodes || nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const titleId = `modal-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-background/80 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="glass-card glow-ring relative w-full max-w-md rounded-2xl p-6 sm:p-8"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Chiudi"
          className="absolute top-4 right-4 rounded-lg border border-border p-1.5 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
        <h2 id={titleId} className="pr-10 font-display text-xl font-bold">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">{children}</div>
        {footer ? <div className="mt-5 text-xs text-muted-foreground">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
