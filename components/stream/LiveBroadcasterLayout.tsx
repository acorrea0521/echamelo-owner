"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function LiveBroadcasterLayout({ streamId }: { streamId: string }) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [auctionPanelOpen, setAuctionPanelOpen] = useState(false);
  const [auctionType, setAuctionType] = useState<"muerte" | "continua" | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [formData, setFormData] = useState({
    productCode: "",
    startPrice: "",
    shipping: "",
  });
  const [chatMessage, setChatMessage] = useState("");
  const chatInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const handleCameraSwitch = async () => {
    try {
      const videoDevices = await navigator.mediaDevices.enumerateDevices();
      const cameraList = videoDevices.filter((d) => d.kind === "videoinput");
      if (cameraList.length <= 1) return;
      const nextIndex = (cameraIndex + 1) % cameraList.length;
      setCameraIndex(nextIndex);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: cameraList[nextIndex].deviceId } },
        audio: true,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameras(cameraList);
    } catch (err) {
      console.error("Error switching camera:", err);
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }).catch(() => {
      console.log("Cámara no disponible");
    });
  }, []);

  useEffect(() => {
    const markAsLive = async () => {
      try {
        await fetch(`/api/streams/${streamId}/go-live`, { method: "POST" });
      } catch (err) {
        console.error("Error marking stream as live:", err);
      }
    };
    markAsLive();
  }, [streamId]);

  const handleAuctionTypeSelect = (type: "muerte" | "continua") => {
    setAuctionType(type);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id.replace("auction-", "")]: value,
    }));
  };

  const isAuctionFormValid = formData.productCode && formData.startPrice && auctionType;

  const handleStartAuction = async () => {
    if (!isAuctionFormValid) return;
    try {
      const res = await fetch(`/api/auctions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          streamId,
          productCode: formData.productCode,
          auctionType,
          startPrice: parseFloat(formData.startPrice),
          shipping: parseFloat(formData.shipping || "0"),
        }),
      });
      if (res.ok) {
        setAuctionPanelOpen(false);
        setFormData({ productCode: "", startPrice: "", shipping: "" });
        setAuctionType(null);
      }
    } catch (err) {
      console.error("Error starting auction:", err);
    }
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;
    console.log("Vendor mensaje:", chatMessage);
    setChatMessage("");
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  const handleEndLive = async () => {
    if (!confirm("¿Estás seguro de que quieres terminar el live?")) return;
    try {
      const res = await fetch(`/api/streams/${streamId}/end-live`, { method: "POST" });
      if (res.ok) {
        window.location.href = "/go-live";
      }
    } catch (err) {
      console.error("Error ending stream:", err);
    }
  };

  if (isMinimized) {
    return (
      <div style={{
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
      }} onClick={() => setIsMinimized(false)}>
        <video ref={videoRef} autoPlay muted playsInline style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }} />
      </div>
    );
  }

  return (
    <div style={{
      width: "100vw",
      height: "100dvh",
      background: "#000",
      margin: 0,
      padding: 0,
      overflow: "hidden",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 50,
    }}>
      <video ref={videoRef} autoPlay muted playsInline style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        background: "#000",
      }} />

      {/* TOP BAR */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        padding: "12px 14px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "linear-gradient(rgba(0,0,0,.6),transparent)",
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            background: "var(--red)",
            color: "#fff",
            borderRadius: "6px",
            padding: "5px 11px",
            fontFamily: "var(--fh)",
            fontSize: "13px",
            fontWeight: 800,
          }}>
            <div style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#fff",
              animation: "pulse 1s infinite",
            }} />
            EN VIVO
          </div>
          <div style={{
            background: "rgba(0,0,0,.7)",
            borderRadius: "8px",
            padding: "5px 10px",
            fontSize: "12px",
            fontWeight: 700,
            color: "#fff",
          }}>
            <i className="ti ti-eye" style={{ fontSize: "12px", marginRight: "3px" }} />
            <span>{viewerCount}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleCameraSwitch} style={{
            background: "rgba(0,0,0,.7)",
            border: "none",
            borderRadius: "8px",
            width: "38px",
            height: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}>
            <i className="ti ti-camera-rotate" style={{ fontSize: "20px", color: "#fff" }} />
          </button>
          <button onClick={() => setIsMinimized(!isMinimized)} style={{
            background: "rgba(0,0,0,.7)",
            border: "none",
            borderRadius: "8px",
            width: "38px",
            height: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}>
            <i className="ti ti-chevron-down" style={{ fontSize: "20px", color: "#fff" }} />
          </button>
          <button onClick={handleEndLive} style={{
            background: "rgba(230,57,70,.85)",
            border: "none",
            borderRadius: "8px",
            width: "38px",
            height: "38px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}>
            <i className="ti ti-power" style={{ fontSize: "20px", color: "#fff" }} />
          </button>
        </div>
      </div>

      {/* CHANNEL INFO */}
      <div style={{
        position: "absolute",
        top: "62px",
        left: "14px",
        background: "rgba(0,0,0,.65)",
        borderRadius: "10px",
        padding: "7px 12px",
        display: "flex",
        alignItems: "center",
        gap: "9px",
        zIndex: 10,
      }}>
        <div style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "var(--gold)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--fh)",
          fontSize: "10px",
          fontWeight: 800,
          color: "#000",
        }}>
          ML
        </div>
        <div>
          <div style={{ fontFamily: "var(--fh)", fontSize: "13px", fontWeight: 800, color: "#fff" }}>
            Mi Canal
          </div>
          <div style={{ fontSize: "10px", color: "rgba(255,255,255,.7)" }}>Categoría</div>
        </div>
      </div>

      {/* AUCTION PANEL */}
      {auctionPanelOpen && (
        <div style={{
          position: "fixed",
          bottom: "50px",
          left: 0,
          right: 0,
          background: "#0d0d0d",
          borderTop: "2px solid var(--gold)",
          maxHeight: "60vh",
          overflowY: "auto",
          pointerEvents: "auto",
          zIndex: 150,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 16px",
            borderBottom: "1px solid #222",
          }}>
            <div style={{ fontFamily: "var(--fh)", fontSize: "14px", fontWeight: 800, color: "var(--gold)" }}>
              🏷️ Nueva Subasta
            </div>
            <button onClick={() => setAuctionPanelOpen(false)} style={{
              background: "none",
              border: "none",
              color: "var(--mute)",
              cursor: "pointer",
              fontSize: "18px",
            }}>
              ✕
            </button>
          </div>

          <div style={{ padding: "10px 16px 8px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "var(--mute)", marginBottom: "5px" }}>
              Código del Producto *
            </label>
            <input type="text" id="auction-product-code" placeholder="Ej: PROD-001..."
              value={formData.productCode} onChange={handleFormChange} style={{
              width: "100%",
              background: "#1e1e1e",
              border: "1.5px solid #333",
              borderRadius: "8px",
              color: "#fff",
              padding: "10px 12px",
              fontSize: "14px",
              fontFamily: "var(--fb)",
              outline: "none",
            }} />
          </div>

          <div style={{ padding: "4px 16px 10px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "var(--mute)", marginBottom: "8px" }}>
              Tipo de Subasta *
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {["muerte", "continua"].map((type) => (
                <div key={type} onClick={() => handleAuctionTypeSelect(type as any)} style={{
                  flex: 1,
                  background: auctionType === type ? "#333" : "#1e1e1e",
                  border: auctionType === type ? "2px solid var(--gold)" : "2px solid #333",
                  borderRadius: "10px",
                  padding: "10px 8px",
                  cursor: "pointer",
                  textAlign: "center",
                  transition: "all .2s",
                }}>
                  <div style={{ fontSize: "22px", marginBottom: "4px" }}>{type === "muerte" ? "💀" : "🔄"}</div>
                  <div style={{ fontFamily: "var(--fh)", fontSize: "12px", fontWeight: 800, color: "#fff" }}>
                    {type === "muerte" ? "Muerte Súbita" : "Continua"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: "0 16px 10px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "var(--mute)", marginBottom: "5px" }}>
              Precio de Salida (MXN) *
            </label>
            <input type="number" id="auction-start-price" placeholder="100" min="1"
              value={formData.startPrice} onChange={handleFormChange} style={{
              width: "100%",
              background: "#1e1e1e",
              border: "1.5px solid #333",
              borderRadius: "8px",
              color: "var(--gold)",
              padding: "10px 12px",
              fontSize: "16px",
              fontFamily: "var(--fh)",
              fontWeight: 800,
              outline: "none",
            }} />
          </div>

          <div style={{ padding: "0 16px 10px" }}>
            <label style={{ display: "block", fontSize: "10px", fontWeight: 700, color: "var(--mute)", marginBottom: "5px" }}>
              Envío y Manejo (MXN)
            </label>
            <input type="number" id="auction-shipping" placeholder="0" min="0"
              value={formData.shipping} onChange={handleFormChange} style={{
              width: "100%",
              background: "#1e1e1e",
              border: "1.5px solid #333",
              borderRadius: "8px",
              color: "var(--blue)",
              padding: "10px 12px",
              fontSize: "16px",
              fontFamily: "var(--fh)",
              fontWeight: 800,
              outline: "none",
            }} />
          </div>

          <div style={{ padding: "4px 16px 14px" }}>
            <button onClick={handleStartAuction} disabled={!isAuctionFormValid} style={{
              width: "100%",
              background: isAuctionFormValid ? "var(--gold)" : "#333",
              border: "none",
              borderRadius: "10px",
              padding: "13px",
              fontFamily: "var(--fh)",
              fontSize: "15px",
              fontWeight: 800,
              color: isAuctionFormValid ? "#000" : "var(--mute)",
              cursor: isAuctionFormValid ? "pointer" : "not-allowed",
            }}>
              {isAuctionFormValid ? "Iniciar Subasta" : "Completa los campos"}
            </button>
          </div>
        </div>
      )}

      {/* CHAT BAR */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "#1a1a1a",
        borderTop: "1px solid #333",
        padding: "10px 12px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        zIndex: 200,
      }}>
        <input ref={chatInputRef} type="text" placeholder="Mensaje..."
          value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} style={{
          flex: 1,
          background: "rgba(0,0,0,.5)",
          border: "1px solid rgba(255,255,255,.2)",
          borderRadius: "12px",
          color: "#fff",
          padding: "8px 12px",
          fontSize: "13px",
          fontFamily: "var(--fb)",
          outline: "none",
        }} />
        <button onClick={handleSendMessage} style={{
          background: "var(--gold)",
          border: "none",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}>
          <i className="ti ti-send" style={{ fontSize: "14px", color: "#000" }} />
        </button>
      </div>

      {/* NUEVA SUBASTA BUTTON */}
      {!auctionPanelOpen && (
        <button onClick={() => setAuctionPanelOpen(true)} style={{
          position: "fixed",
          bottom: "60px",
          right: "20px",
          width: "180px",
          background: "var(--gold)",
          border: "none",
          borderRadius: "12px",
          padding: "16px 24px",
          fontFamily: "var(--fh)",
          fontSize: "15px",
          fontWeight: 800,
          color: "#000",
          cursor: "pointer",
          zIndex: 250,
          boxShadow: "0 4px 12px rgba(245,200,66,.4)",
        }}>
          🏷️ Nueva Subasta
        </button>
      )}
    </div>
  );
}
