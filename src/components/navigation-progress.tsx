"use client";

import { Loader2Icon } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const START_EVENT = "app:navigation-start";
const SHOW_DELAY_MS = 180;
const MAX_MS = 15000;

export function startNavigationProgress() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(START_EVENT));
}

function locationKeyFrom(url: URL) {
  return `${url.pathname}?${url.searchParams.toString()}`;
}

function clearLoadingMarks() {
  document.querySelectorAll("[data-loading='true']").forEach((node) => {
    if (node instanceof HTMLButtonElement) return;
    node.removeAttribute("data-loading");
    node.removeAttribute("aria-busy");
  });
}

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locationKey = `${pathname}?${searchParams.toString()}`;
  const locationKeyRef = useRef(locationKey);
  const showTimer = useRef(0);
  const hideTimer = useRef(0);
  const [visible, setVisible] = useState(false);

  locationKeyRef.current = locationKey;

  useEffect(() => {
    function stop() {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(hideTimer.current);
      setVisible(false);
      clearLoadingMarks();
      document.body.removeAttribute("data-navigating");
    }

    function start() {
      window.clearTimeout(showTimer.current);
      window.clearTimeout(hideTimer.current);
      showTimer.current = window.setTimeout(() => {
        setVisible(true);
        document.body.setAttribute("data-navigating", "true");
      }, SHOW_DELAY_MS);
      hideTimer.current = window.setTimeout(stop, MAX_MS);
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (locationKeyFrom(url) === locationKeyRef.current) return;

      anchor.setAttribute("data-loading", "true");
      anchor.setAttribute("aria-busy", "true");
      start();
    }

    function onSubmit(event: Event) {
      if (event.defaultPrevented) return;

      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const action = form.getAttribute("action");
      if (!action || action.startsWith("javascript:")) return;

      let url: URL;
      try {
        url = new URL(action, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (locationKeyFrom(url) === locationKeyRef.current) return;

      start();
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    window.addEventListener("popstate", start);
    window.addEventListener(START_EVENT, start);

    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      window.removeEventListener("popstate", start);
      window.removeEventListener(START_EVENT, start);
      window.clearTimeout(showTimer.current);
      window.clearTimeout(hideTimer.current);
      document.body.removeAttribute("data-navigating");
    };
  }, []);

  useEffect(() => {
    window.clearTimeout(showTimer.current);
    window.clearTimeout(hideTimer.current);
    setVisible(false);
    clearLoadingMarks();
    document.body.removeAttribute("data-navigating");
  }, [locationKey]);

  if (!visible) return null;

  return (
    <div className="nav-progress pointer-events-none">
      <div
        role="progressbar"
        aria-valuetext="Carregando"
        className="fixed inset-x-0 top-0 z-80 h-1 overflow-hidden bg-primary/15"
      >
        <div className="nav-progress-bar bg-brand-gold h-full w-1/3" />
      </div>
      <p className="bg-primary text-primary-foreground fixed top-3 left-1/2 z-80 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium shadow-lg">
        <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
        Carregando
      </p>
    </div>
  );
}
