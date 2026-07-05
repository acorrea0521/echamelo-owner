"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Stream {
  id: string;
  title: string;
  viewer_count: number;
  profiles: { username: string; display_name: string } | null;
}

export default function LivePage() {
  const router = useRouter();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const res = await fetch("/api/streams/active");
        if (res.ok) {
          const data = await res.json();
          setStreams(data);
        }
      } catch (err) {
        console.error("Error fetching streams:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStreams();
    const interval = setInterval(fetchStreams, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      width: "100%",
      minHeight: "100vh",
      background: "#0d0d0d",
      color: "#fff",
      padding: "16px",
    }}>
      <div style={{
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        {/* HEADER */}
        <div style={{
          marginBottom: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <h1 style={{
            fontFamily: "var(--fh)",
            fontSize: "32px",
            fontWeight: 800,
            margin: 0,
            color: "var(--gold)",
          }}>
            🔴 EN VIVO
          </h1>
          <button onClick={() => router.back()} style={{
            background: "rgba(255,255,255,.1)",
            border: "none",
            borderRadius: "8px",
            padding: "8px 16px",
            color: "#fff",
            cursor: "pointer",
            fontFamily: "var(--fb)",
          }}>
            ← Atrás
          </button>
        </div>

        {/* STREAMS GRID */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>Cargando streams...</div>
        ) : streams.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "rgba(255,255,255,.5)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>😴</div>
            <p>No hay transmisiones en vivo en este momento</p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}>
            {streams.map((stream) => (
              <div
                key={stream.id}
                onClick={() => router.push(`/stream/${stream.id}`)}
                style={{
                  background: "rgba(255,255,255,.05)",
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: "12px",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all .2s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,.1)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "var(--gold)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,.05)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,.1)";
                }}
              >
                {/* THUMBNAIL */}
                <div style={{
                  width: "100%",
                  aspectRatio: "16/9",
                  background: "linear-gradient(135deg, #1a1a1a, #0d0d0d)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}>
                  <div style={{
                    fontSize: "64px",
                  }}>
                    📹
                  </div>
                  {/* LIVE BADGE */}
                  <div style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    background: "var(--red)",
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontFamily: "var(--fh)",
                    fontSize: "11px",
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}>
                    <span style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#fff",
                      animation: "pulse 1s infinite",
                    }} />
                    EN VIVO
                  </div>
                  {/* VIEWERS */}
                  <div style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    background: "rgba(0,0,0,.7)",
                    color: "#fff",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}>
                    👁️ {stream.viewer_count}
                  </div>
                </div>

                {/* INFO */}
                <div style={{ padding: "12px" }}>
                  <h3 style={{
                    fontFamily: "var(--fh)",
                    fontSize: "14px",
                    fontWeight: 800,
                    margin: "0 0 8px",
                    color: "#fff",
                  }}>
                    {stream.title}
                  </h3>
                  <p style={{
                    fontFamily: "var(--fb)",
                    fontSize: "12px",
                    margin: 0,
                    color: "rgba(255,255,255,.7)",
                  }}>
                    por {stream.profiles?.display_name || stream.profiles?.username || "Usuario"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
