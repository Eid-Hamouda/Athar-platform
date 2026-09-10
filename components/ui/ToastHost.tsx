"use client";

import { Toaster } from "react-hot-toast";

/**
 * Single app-wide toast host, themed to the ink surface so notifications read
 * as part of the design rather than a library default.
 */
export function ToastHost() {
  return (
    <Toaster
      position="top-center"
      containerStyle={{ zIndex: 2000 }}
      toastOptions={{
        duration: 4000,
        style: {
          background: "#091713",
          color: "#fdfbf7",
          borderRadius: "16px",
          padding: "12px 18px",
          fontSize: "14px",
          fontWeight: 500,
          lineHeight: 1.6,
          maxWidth: "26rem",
          boxShadow: "0 24px 48px -12px rgba(9, 23, 19, 0.4)",
          border: "1px solid rgba(253, 251, 247, 0.12)",
        },
        success: { iconTheme: { primary: "#3bbc93", secondary: "#091713" } },
        error: { iconTheme: { primary: "#fb7185", secondary: "#091713" } },
        loading: { iconTheme: { primary: "#ffc453", secondary: "#091713" } },
      }}
    />
  );
}
