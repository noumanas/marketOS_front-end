"use client";

import { useEffect, useRef, useState } from "react";
import { api, type AuthResponse } from "@/services/api";

const GIS_SRC = "https://accounts.google.com/gsi/client";

const loadGis = () =>
  new Promise<void>((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    let script = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = GIS_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Could not load Google sign-in")));
  });

/** "Continue with Google" — hidden when the backend has no GOOGLE_CLIENT_ID */
export default function GoogleButton({
  onSuccess,
  onError,
  text = "continue_with",
}: {
  onSuccess: (res: AuthResponse) => void;
  onError: (msg: string) => void;
  text?: "signin_with" | "signup_with" | "continue_with";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "disabled">("loading");
  // Keep the latest callbacks without re-initialising Google on every render
  const handlers = useRef({ onSuccess, onError });
  handlers.current = { onSuccess, onError };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { googleClientId } = await api.auth.config();
        if (!googleClientId) return !cancelled && setState("disabled");
        await loadGis();
        if (cancelled || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async ({ credential }) => {
            try {
              handlers.current.onSuccess(await api.auth.google(credential));
            } catch (err) {
              handlers.current.onError(err instanceof Error ? err.message : "Google sign-in failed");
            }
          },
        });
        window.google.accounts.id.renderButton(ref.current, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text,
          width: ref.current.offsetWidth || 320,
        });
        setState("ready");
      } catch {
        if (!cancelled) setState("disabled");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [text]);

  if (state === "disabled") {
    return (
      <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center" }}>
        Google sign-in isn&apos;t set up yet (add <code>GOOGLE_CLIENT_ID</code> to the backend).
      </p>
    );
  }

  return <div ref={ref} style={{ width: "100%", minHeight: 44, display: "flex", justifyContent: "center" }} />;
}
