"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DevContentRefresh() {
  const router = useRouter();
  useEffect(() => {
    let revision;
    let stopped = false;
    let timer;
    const controller = new AbortController();
    async function poll() {
      try {
        if (!document.hidden) {
          const response = await fetch("/api/dev/content-revision", {
            cache: "no-store",
            signal: controller.signal,
          });
          if (response.ok) {
            const next = (await response.json()).revision;
            // Refresh once on mount too, covering changes between SSR and polling.
            if (!stopped && next !== revision) {
              revision = next;
              router.refresh();
            }
          }
        }
      } catch {
        // The API may briefly restart during backend edits; retry automatically.
      } finally {
        if (!stopped) timer = setTimeout(poll, 1000);
      }
    }
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [router]);
  return null;
}
