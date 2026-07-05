import React from "react";

export function EchameloCSSProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
        }
        :root {
          --bg: #0D0D0D;
          --s1: #181818;
          --s2: #1e1e1e;
          --s3: #2a2a2a;
          --gold: #F5C842;
          --gold2: #C8961A;
          --red: #E63946;
          --green: #2DC653;
          --blue: #378ADD;
          --txt: #F0EDE8;
          --mute: #888;
          --brd: #2e2e2e;
          --fh: 'Syne', sans-serif;
          --fb: 'Nunito', sans-serif;
        }
        html, body {
          height: 100% !important;
          height: 100dvh !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          overscroll-behavior: none !important;
          width: 100% !important;
        }
        body {
          color: var(--txt);
          font-family: var(--fb);
          font-size: 14px;
          background: var(--bg) !important;
          display: block !important;
        }
        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }

        /* animations */
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes bounceIn {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          55% {
            transform: scale(1.1);
          }
          75% {
            transform: scale(0.93);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-9px);
          }
        }
        @keyframes glow {
          0%, 100% {
            text-shadow: 0 0 22px #F5C84244;
          }
          50% {
            text-shadow: 0 0 48px #F5C842aa;
          }
        }
        @keyframes shimmer {
          0% {
            left: -120%;
          }
          100% {
            left: 220%;
          }
        }
        @keyframes tickMove {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.25;
          }
        }
        @keyframes liveRing {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.5);
          }
          50% {
            box-shadow: 0 0 0 14px rgba(230, 57, 70, 0);
          }
        }
        @keyframes checkPop {
          0% {
            transform: scale(0);
          }
          70% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=Nunito:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />
      {children}
    </>
  );
}
