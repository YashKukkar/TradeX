import { useEffect } from "react";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keeps keyboard focus inside a dialog while it is open:
 * - moves focus into the dialog on open (unless something inside already has it),
 * - wraps Tab / Shift+Tab at the ends,
 * - gives focus back to the element that opened the dialog on close.
 */
export function useFocusTrap(ref: React.RefObject<HTMLElement | null>, isOpen: boolean) {
  useEffect(() => {
    if (!isOpen || !ref.current) return;

    const element = ref.current;
    const opener = document.activeElement as HTMLElement | null;
    const getFocusable = () => Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE));

    if (!element.contains(document.activeElement)) {
      (getFocusable()[0] ?? element).focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = getFocusable();
      if (!focusable.length) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !element.contains(active))) {
        last.focus();
        e.preventDefault();
      } else if (!e.shiftKey && (active === last || !element.contains(active))) {
        first.focus();
        e.preventDefault();
      }
    };

    element.addEventListener("keydown", handleKeyDown);
    return () => {
      element.removeEventListener("keydown", handleKeyDown);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [isOpen, ref]);
}
