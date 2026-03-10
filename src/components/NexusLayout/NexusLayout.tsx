import React from "react";
import { NexusNav } from "./NexusNav";

interface NexusLayoutProps {
  children: React.ReactNode;
}

export const NexusLayout: React.FC<NexusLayoutProps> = ({ children }) => {
  return (
    <>
      {/* Animated mesh gradient background */}
      <div className="nexus-bg" aria-hidden="true" />

      {/* Floating orbs */}
      <div className="nexus-orb nexus-orb-1" aria-hidden="true" />
      <div className="nexus-orb nexus-orb-2" aria-hidden="true" />
      <div className="nexus-orb nexus-orb-3" aria-hidden="true" />

      {/* Navigation */}
      <NexusNav />

      {/* Main content */}
      <main className="nexus-layout">{children}</main>

      {/* Footer */}
      <footer
        style={{
          textAlign: "center",
          padding: "20px 24px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(5,5,15,0.6)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          flexWrap: "wrap",
          fontSize: 13,
          color: "rgba(255,255,255,0.35)",
          fontFamily: "Outfit, sans-serif",
        }}
      >
        <span>Built by Sajjad Hossain</span>
        <a
          href="https://sajjad-hossain.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#00f5ff",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <span>🌐</span> Website
        </a>
        <a
          href="https://www.linkedin.com/in/sajjad19397/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: "#0a66c2",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 5,
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <span>💼</span> LinkedIn
        </a>
      </footer>
    </>
  );
};

export default NexusLayout;
