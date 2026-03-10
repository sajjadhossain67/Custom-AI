import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { NEXUS_ROUTES } from "../../shared/routes";

const navItems = [
  { label: "Dashboard", path: NEXUS_ROUTES.HOME, icon: "⬡" },
  { label: "AI Chat", path: NEXUS_ROUTES.CHAT, icon: "◈" },
  { label: "Code Tutor", path: NEXUS_ROUTES.CODE, icon: "⟨/⟩" },
  { label: "Exam Prep", path: NEXUS_ROUTES.EXAM, icon: "◆" },
  { label: "Explore", path: NEXUS_ROUTES.EXPLORE, icon: "✦" },
];

export const NexusNav: React.FC = () => {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

  return (
    <>
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "var(--nav-height)",
          zIndex: 500,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          background: scrolled ? "rgba(5,5,15,0.9)" : "rgba(5,5,15,0.5)",
          backdropFilter: scrolled ? "blur(60px) saturate(180%)" : "blur(40px)",
          WebkitBackdropFilter: scrolled
            ? "blur(60px) saturate(180%)"
            : "blur(40px)",
          borderBottom: scrolled
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid rgba(255,255,255,0.04)",
          transition: "all 0.4s cubic-bezier(0.4,0,0.2,1)",
          boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.4)" : "none",
        }}
      >
        {/* Logo */}
        <Link
          to={NEXUS_ROUTES.HOME}
          style={{
            display: "flex",
            alignItems: "center",
            textDecoration: "none",
            flexShrink: 0,
          }}
        >
          <img
            src="/nexus.png"
            alt="NEXUS AI"
            style={{
              width: 120,
              height: 60,
              borderRadius: 12,
              objectFit: "contain",
              boxShadow: "0 0 32px rgba(0,245,255,0.5)",
            }}
          />
        </Link>

        {/* Desktop Nav */}
        <div
          className="nexus-desktop-nav"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            marginLeft: 48,
            flex: 1,
          }}
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 15px",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "Outfit",
                color: isActive(item.path)
                  ? "#00f5ff"
                  : "rgba(255,255,255,0.55)",
                background: isActive(item.path)
                  ? "rgba(0,245,255,0.08)"
                  : "transparent",
                border: isActive(item.path)
                  ? "1px solid rgba(0,245,255,0.2)"
                  : "1px solid transparent",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right: Settings + Mobile toggle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginLeft: "auto",
          }}
        >
          <Link
            to={NEXUS_ROUTES.SETTINGS}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: isActive(NEXUS_ROUTES.SETTINGS)
                ? "rgba(0,245,255,0.1)"
                : "rgba(255,255,255,0.04)",
              border: isActive(NEXUS_ROUTES.SETTINGS)
                ? "1px solid rgba(0,245,255,0.25)"
                : "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              textDecoration: "none",
              color: isActive(NEXUS_ROUTES.SETTINGS)
                ? "#00f5ff"
                : "rgba(255,255,255,0.55)",
              transition: "all 0.2s ease",
            }}
          >
            ⚙
          </Link>
          <button
            className="nexus-mobile-menu-btn"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: "none",
              width: 38,
              height: 38,
              borderRadius: 10,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.8)",
              cursor: "pointer",
              fontSize: 20,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            top: "var(--nav-height)",
            left: 0,
            right: 0,
            background: "rgba(5,5,20,0.97)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            zIndex: 499,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            animation: "fadeInUp 0.3s ease",
          }}
        >
          {[
            ...navItems,
            { label: "Settings", path: NEXUS_ROUTES.SETTINGS, icon: "⚙" },
          ].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 16px",
                borderRadius: 12,
                textDecoration: "none",
                fontSize: 15,
                fontWeight: 600,
                fontFamily: "Outfit",
                color: isActive(item.path)
                  ? "#00f5ff"
                  : "rgba(255,255,255,0.8)",
                background: isActive(item.path)
                  ? "rgba(0,245,255,0.08)"
                  : "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 800px) {
          .nexus-desktop-nav { display: none !important; }
          .nexus-mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
};

export default NexusNav;
