"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Q BMS Auth Boot Guard
 *
 * Prevents the Login UI from being painted for a moment while the existing
 * authentication/session bootstrap decides whether the user should remain
 * on Login or be routed into Q BMS.
 *
 * This component does NOT change authentication, roles, permissions,
 * cookies/tokens, API routes, or database data.
 */
export default function AuthBootGuard() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let disposed = false;

    const isLoginRoute =
      pathname === "/login" ||
      pathname?.startsWith("/login/") ||
      pathname?.includes("signin") ||
      pathname?.includes("sign-in");

    const minimumVisibleMs = isLoginRoute ? 850 : 140;
    const safetyTimeoutMs = isLoginRoute ? 1800 : 500;

    let minimumElapsed = false;
    let documentReady = document.readyState === "complete";

    const finish = () => {
      if (!disposed && minimumElapsed && documentReady) {
        setVisible(false);
      }
    };

    const minimumTimer = window.setTimeout(() => {
      minimumElapsed = true;
      finish();
    }, minimumVisibleMs);

    const safetyTimer = window.setTimeout(() => {
      if (!disposed) {
        setVisible(false);
      }
    }, safetyTimeoutMs);

    const handleLoad = () => {
      documentReady = true;
      finish();
    };

    window.addEventListener("load", handleLoad);

    return () => {
      disposed = true;
      window.clearTimeout(minimumTimer);
      window.clearTimeout(safetyTimer);
      window.removeEventListener("load", handleLoad);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      aria-label="Loading Q BMS"
      aria-live="polite"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "grid",
        placeItems: "center",
        background: "#f7fbff",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
          color: "#14395f",
          fontFamily:
            'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: 17,
            display: "grid",
            placeItems: "center",
            background:
              "linear-gradient(145deg, #0b78f6 0%, #21a8f5 60%, #37c7a1 100%)",
            color: "#ffffff",
            fontSize: 25,
            fontWeight: 900,
            boxShadow: "0 12px 30px rgba(11, 120, 246, 0.22)",
          }}
        >
          Q
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 17,
              lineHeight: 1.2,
              fontWeight: 850,
              letterSpacing: "-0.02em",
            }}
          >
            Q BMS
          </div>
          <div
            style={{
              marginTop: 5,
              fontSize: 11,
              color: "#71869c",
            }}
          >
            Loading workspace...
          </div>
        </div>

        <div
          style={{
            width: 86,
            height: 3,
            overflow: "hidden",
            borderRadius: 999,
            background: "#deebf7",
          }}
        >
          <div
            className="qbms-boot-progress"
            style={{
              width: "45%",
              height: "100%",
              borderRadius: 999,
              background: "#1478ec",
            }}
          />
        </div>

        <style jsx>{`
          .qbms-boot-progress {
            animation: qbmsBootMove 0.8s ease-in-out infinite alternate;
          }

          @keyframes qbmsBootMove {
            from {
              transform: translateX(-55%);
            }

            to {
              transform: translateX(120%);
            }
          }
        `}</style>
      </div>
    </div>
  );
}
