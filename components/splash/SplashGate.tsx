"use client";

import { useEffect, useState } from "react";
import { SplashScreen } from "./SplashScreen";

const SESSION_KEY = "echamelo_splash_shown";

// Shows the catch-animation splash once per browser session (not on every
// client-side navigation). Renders as an overlay so the page underneath can
// mount/fetch immediately — the splash just visually covers it until done.
export function SplashGate() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <SplashScreen
      onDone={() => {
        sessionStorage.setItem(SESSION_KEY, "1");
        setVisible(false);
      }}
    />
  );
}
