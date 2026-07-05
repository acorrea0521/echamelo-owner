"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function GoLivePage() {
  const router = useRouter();

  useEffect(() => {
    const createStream = async () => {
      try {
        const res = await fetch("/api/streams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Mi Transmisión en Vivo" }),
        });
        if (res.ok) {
          const { id } = await res.json();
          router.push(`/go-live/${id}/manage`);
        }
      } catch (err) {
        console.error("Error creating stream:", err);
      }
    };
    createStream();
  }, [router]);

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      background: "#000",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontFamily: "var(--fh)",
    }}>
      Iniciando transmisión en vivo...
    </div>
  );
}
