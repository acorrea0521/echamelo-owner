"use client";

import { useState } from "react";
import Link from "next/link";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  viewerCount: number;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  moda: "👕",
  joyeria: "💎",
  tecnologia: "📱",
  artesanias: "🎨",
  gaming: "🎮",
  electronica: "🎧",
  comida: "🍬",
  deportes: "🏈",
  libros: "📚",
  zapatillas: "👟",
  tarjetas: "🎴",
  trading: "🃏",
};

export function CategoriesLayout({ categories }: { categories: Category[] }) {
  const [activeTab, setActiveTab] = useState<"recommended" | "popular" | "a-z">("recommended");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedCategories =
    activeTab === "a-z"
      ? [...filteredCategories].sort((a, b) => a.name.localeCompare(b.name))
      : activeTab === "popular"
        ? [...filteredCategories].sort((a, b) => b.viewerCount - a.viewerCount)
        : filteredCategories;

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--txt)",
        fontFamily: "var(--fb)",
        padding: "12px",
        paddingBottom: "100px",
      }}
    >
      {/* Search Bar */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: "24px",
              padding: "10px 16px",
            }}
          >
            <i className="ti ti-search" style={{ color: "var(--mute)", fontSize: "18px" }}></i>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                color: "var(--txt)",
                outline: "none",
                fontSize: "16px",
              }}
            />
          </div>
          <button
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "var(--gold)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            🎁
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        {(["recommended", "popular", "a-z"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "10px 20px",
              borderRadius: "24px",
              border: "none",
              background: activeTab === tab ? "white" : "var(--s2)",
              color: activeTab === tab ? "#000" : "var(--txt)",
              fontFamily: activeTab === tab ? "var(--fh)" : "var(--fb)",
              fontWeight: activeTab === tab ? 700 : 600,
              fontSize: "14px",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Categories Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "12px",
        }}
      >
        {sortedCategories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            style={{
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <div
              style={{
                background: "var(--s2)",
                borderRadius: "14px",
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "180px",
                cursor: "pointer",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.transform = "scale(1)";
              }}
            >
              {/* Icon/Emoji */}
              <div style={{ fontSize: "42px", textAlign: "center" }}>
                {CATEGORY_EMOJIS[category.slug] || "🏷️"}
              </div>

              {/* Category Name */}
              <div
                style={{
                  fontFamily: "var(--fh)",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "var(--txt)",
                  textAlign: "center",
                  marginBottom: "8px",
                }}
              >
                {category.name}
              </div>

              {/* Viewers Count */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "11px",
                  color: "var(--txt)",
                  justifyContent: "center",
                }}
              >
                <div
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--red)",
                  }}
                ></div>
                <span>{formatViewers(category.viewerCount)} Viewers</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function formatViewers(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}
