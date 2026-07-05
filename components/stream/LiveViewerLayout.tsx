"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Room, RoomEvent, type RemoteParticipant } from "livekit-client";

export function LiveViewerLayout({ streamId }: { streamId: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room | null>(null);
  const [hasAuction, setHasAuction] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const chatRef = useRef<HTMLDivElement>(null);
  const swipeTrackRef = useRef<HTMLDivElement>(null);
  const swipeThumbRef = useRef<HTMLDivElement>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [chatMessage, setChatMessage] = useState("");
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Swipe to bid logic
  useEffect(() => {
    if (!swipeTrackRef.current || !swipeThumbRef.current) return;

    let isGrabbing = false;
    let startX = 0;
    let currentX = 0;

    const trackRect = swipeTrackRef.current.getBoundingClientRect();
    const maxX = trackRect.width - 40;

    const handleMouseDown = (e: MouseEvent | TouchEvent) => {
      isGrabbing = true;
      startX = "touches" in e ? e.touches[0].clientX : e.clientX;
      swipeThumbRef.current!.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isGrabbing) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      currentX = Math.max(0, Math.min(maxX, clientX - startX));
      const progress = (currentX / maxX) * 100;
      setSwipeProgress(progress);
      swipeThumbRef.current!.style.left = `calc(4px + ${currentX}px)`;
    };

    const handleMouseUp = () => {
      isGrabbing = false;
      swipeThumbRef.current!.style.cursor = "grab";
      if (swipeProgress > 80) {
        // Bid confirmed
        console.log("Bid placed!");
      }
      setSwipeProgress(0);
      swipeThumbRef.current!.style.left = "4px";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("touchmove", handleMouseMove);
    document.addEventListener("touchend", handleMouseUp);
    swipeThumbRef.current.addEventListener("mousedown", handleMouseDown);
    swipeThumbRef.current.addEventListener("touchstart", handleMouseDown);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("touchmove", handleMouseMove);
      document.removeEventListener("touchend", handleMouseUp);
      swipeThumbRef.current?.removeEventListener("mousedown", handleMouseDown);
      swipeThumbRef.current?.removeEventListener("touchstart", handleMouseDown);
    };
  }, [swipeProgress]);

  useEffect(() => {
    if (isMinimized) {
      router.push("/home");
    }
  }, [isMinimized, router]);

  useEffect(() => {
    const fetchViewers = async () => {
      try {
        const res = await fetch(`/api/streams/${streamId}`);
        if (res.ok) {
          const data = await res.json();
          setViewerCount(data.viewer_count || 0);
        }
      } catch (err) {
        console.error("Error fetching viewers:", err);
      }
    };
    fetchViewers();
    const interval = setInterval(fetchViewers, 5000);
    return () => clearInterval(interval);
  }, [streamId]);

  useEffect(() => {
    const connectToLiveKit = async () => {
      try {
        const tokenRes = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streamId }),
        });
        const { token, url } = await tokenRes.json();

        const room = new Room();
        roomRef.current = room;

        const attachVideoTrack = (publication: any) => {
          if (publication.track && videoRef.current) {
            const element = publication.track.attach();
            element.style.width = "100%";
            element.style.height = "100%";
            element.style.objectFit = "cover";
            videoRef.current.innerHTML = "";
            videoRef.current.appendChild(element);
          }
        };

        room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
          console.log("Participante conectado:", participant.name);
          participant.videoTrackPublications.forEach((pub) => {
            console.log("Video track encontrado:", pub);
            attachVideoTrack(pub);
          });
        });

        room.on(RoomEvent.TrackSubscribed, (track: any) => {
          console.log("Track suscrito:", track.kind);
          if (track.kind === "video" && videoRef.current) {
            const element = track.attach();
            element.style.width = "100%";
            element.style.height = "100%";
            element.style.objectFit = "cover";
            videoRef.current.innerHTML = "";
            videoRef.current.appendChild(element);
          }
        });

        await room.connect(url, token);
        console.log("Conectado a LiveKit. Participantes remotos:", room.remoteParticipants.size);

        // Attach video from existing participants
        room.remoteParticipants.forEach((participant) => {
          console.log("Participante remoto existente:", participant.name);
          participant.videoTrackPublications.forEach((pub) => {
            console.log("Video track existente:", pub);
            attachVideoTrack(pub);
          });
        });
      } catch (err) {
        console.error("Error connecting to LiveKit:", err);
      }
    };

    connectToLiveKit();

    return () => {
      roomRef.current?.disconnect();
    };
  }, [streamId]);

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    console.log("Mensaje enviado:", chatMessage);
    setChatMessage("");
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  if (isMinimized) {
    return (
      <div
        style={{
          position: "fixed",
          bottom: "60px",
          right: "12px",
          width: "50%",
          height: "50%",
          borderRadius: "16px",
          overflow: "hidden",
          zIndex: 1000,
          boxShadow: "0 8px 24px rgba(0,0,0,.9)",
          cursor: "pointer",
        }}
        onClick={() => setIsMinimized(false)}
      >
        <div
          ref={videoRef}
          style={{
            width: "100%",
            height: "100%",
            background: "#000",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100vh", background: "#000", overflow: "hidden" }}>
      {/* VIDEO DE FONDO */}
      <div
        ref={videoRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
          background: "#000",
          overflow: "hidden",
          zIndex: 1,
          margin: 0,
          padding: 0,
        }}
      />

      {/* OVERLAY COMPLETO */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          zIndex: 10,
          pointerEvents: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* TOP BAR */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px",
            pointerEvents: "auto",
          }}
        >
          {/* Avatar + nombre */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={() => router.back()}
              style={{
                background: "transparent",
                border: "none",
                padding: 0,
                marginRight: "2px",
                cursor: "pointer",
              }}
            >
              <i
                className="ti ti-arrow-left"
                style={{
                  color: "#fff",
                  fontSize: "20px",
                  textShadow: "0 1px 4px rgba(0,0,0,.8)",
                }}
              ></i>
            </button>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: "var(--gold)",
                border: "2px solid #fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--fh)",
                fontSize: "13px",
                fontWeight: 800,
                color: "#000",
                flexShrink: 0,
              }}
            >
              ML
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--fh)",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#fff",
                  lineHeight: 1,
                  textShadow: "0 1px 4px rgba(0,0,0,.9)",
                }}
              >
                Vendedor
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "rgba(255,255,255,.8)",
                  textShadow: "0 1px 3px rgba(0,0,0,.9)",
                }}
              >
                Categoría
              </div>
            </div>
            <button
              style={{
                background: "var(--gold)",
                border: "none",
                borderRadius: "20px",
                padding: "4px 12px",
                fontFamily: "var(--fh)",
                fontSize: "11px",
                fontWeight: 800,
                color: "#000",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              + Seguir
            </button>
          </div>

          {/* Viewers + share */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                background: "rgba(230,57,70,.85)",
                borderRadius: "20px",
                padding: "3px 8px",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <div
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#fff",
                }}
              ></div>
              <span
                style={{
                  fontFamily: "var(--fh)",
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {viewerCount}
              </span>
            </div>
            <button
              style={{
                background: "rgba(0,0,0,.4)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <i
                className="ti ti-share"
                style={{ color: "#fff", fontSize: "15px" }}
              ></i>
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              style={{
                background: "rgba(0,0,0,.4)",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                marginLeft: "6px",
              }}
              title="Minimizar"
            >
              <i
                className="ti ti-chevron-down"
                style={{ color: "#fff", fontSize: "15px" }}
              ></i>
            </button>
          </div>
        </div>

        {/* MIDDLE: chat + side icons */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "flex-end",
            padding: "0 0 8px 0",
            minHeight: 0,
            pointerEvents: "auto",
          }}
        >
          {/* Chat */}
          <div
            ref={chatRef}
            style={{
              flex: 1,
              padding: "4px 8px",
              maxHeight: "200px",
              overflowY: "auto",
              background: "transparent",
            }}
          ></div>

          {/* Side icons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "14px",
              padding: "0 10px 4px",
            }}
          >
            {["Store", "Wallet", "Share", "Compras"].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "2px",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: i === 0 ? "rgba(245,200,66,.85)" : "rgba(0,0,0,.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <i
                    className={`ti ti-${
                      ["building-store", "wallet", "share-2", "shopping-bag"][i]
                    }`}
                    style={{
                      fontSize: "20px",
                      color: i === 0 ? "#000" : "#fff",
                    }}
                  ></i>
                </div>
                <span
                  style={{
                    fontSize: "9px",
                    color: "#fff",
                    textShadow: "0 1px 3px rgba(0,0,0,.9)",
                    fontWeight: 600,
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM PANEL */}
        <div
          style={{
            pointerEvents: "auto",
            padding: "0 10px 12px",
          }}
        >
          {/* AUCTION CARD */}
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                background: "rgba(18,18,18,.75)",
                backdropFilter: "blur(12px)",
                borderRadius: "14px",
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,.1)",
              }}
            >
              {/* Status */}
              <div style={{ padding: "7px 12px 0" }}>
                <span
                  style={{
                    display: "inline-block",
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--mute)",
                    marginRight: "5px",
                    verticalAlign: "middle",
                  }}
                ></span>
                <span style={{ fontSize: "11px", color: "#fff" }}>Sin ofertas todavía</span>
              </div>

              {/* Producto row */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 12px" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    background: "rgba(255,255,255,.08)",
                    border: "1px solid rgba(255,255,255,.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: "22px" }}>🏷️</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "var(--fh)",
                      fontSize: "13px",
                      fontWeight: 800,
                      color: "#fff",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    ITEM
                  </div>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,.6)" }}>
                    💀 Muerte Súbita
                  </div>
                </div>
              </div>

              {/* Líder */}
              <div style={{ padding: "0 12px 7px", fontSize: "10px", color: "rgba(255,255,255,.5)" }}>
                Líder: <span style={{ color: "#fff", fontWeight: 700 }}>Sin ofertas</span>
              </div>

              {/* Botones puja */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  padding: "0 10px 10px",
                  alignItems: "center",
                }}
              >
                <button
                  style={{
                    background: "transparent",
                    border: "1.5px solid rgba(255,255,255,.3)",
                    borderRadius: "20px",
                    padding: "0 14px",
                    height: "44px",
                    fontFamily: "var(--fh)",
                    fontSize: "12px",
                    fontWeight: 800,
                    color: "#fff",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  Custom
                </button>

                {/* Swipe-to-bid or "Waiting for auction" */}
                {hasAuction ? (
                  <div
                    ref={swipeTrackRef}
                    style={{
                      position: "relative",
                      flex: 1,
                      height: "44px",
                      background: "rgba(245,200,66,.15)",
                      border: "2px solid var(--gold)",
                      borderRadius: "22px",
                      overflow: "hidden",
                      touchAction: "none",
                      userSelect: "none",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--fh)",
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "var(--gold)",
                        pointerEvents: "none",
                        gap: "3px",
                      }}
                    >
                      <span>Bid: $0</span>
                      <i className="ti ti-chevrons-right" style={{ fontSize: "15px" }}></i>
                      <i
                        className="ti ti-chevrons-right"
                        style={{ fontSize: "15px", marginLeft: "-10px", opacity: 0.5 }}
                      ></i>
                    </div>
                    <div
                      ref={swipeThumbRef}
                      style={{
                        position: "absolute",
                        top: "4px",
                        left: "4px",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "var(--gold)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "grab",
                        transition: "left .25s cubic-bezier(.2,.9,.3,1.3)",
                        zIndex: 2,
                      }}
                    >
                      <i className="ti ti-gavel" style={{ fontSize: "16px", color: "#000" }}></i>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      flex: 1,
                      height: "44px",
                      background: "rgba(0,0,0,.4)",
                      border: "2px solid rgba(255,255,255,.2)",
                      borderRadius: "22px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "var(--fb)",
                      fontSize: "13px",
                      color: "rgba(255,255,255,.7)",
                      textAlign: "center",
                      padding: "0 16px",
                    }}
                  >
                    Esperando próxima subasta
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CHAT INPUT */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              ref={chatInputRef}
              type="text"
              placeholder="Say something..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              style={{
                flex: 1,
                padding: "10px 16px",
                fontSize: "13px",
                background: "rgba(30,30,30,.7)",
                border: "1.5px solid rgba(255,255,255,.15)",
                borderRadius: "24px",
                color: "#fff",
                outline: "none",
                backdropFilter: "blur(6px)",
              }}
            />
            <button
              onClick={handleSendMessage}
              style={{
                background: "var(--gold)",
                border: "none",
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <i className="ti ti-send" style={{ fontSize: "16px", color: "#000" }}></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
