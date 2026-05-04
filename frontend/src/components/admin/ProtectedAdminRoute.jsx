import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { DEMO_MODE, adminApi } from "../../lib/api.js";

export function ProtectedAdminRoute({ children }) {
  const [state, setState] = useState("loading");

  useEffect(() => {
    if (DEMO_MODE && window.localStorage.getItem("marana_admin_demo_session") === "ok") {
      setState("ok");
      return;
    }
    adminApi
      .session()
      .then(() => setState("ok"))
      .catch(() => setState("blocked"));
  }, []);

  if (state === "loading") {
    return <div className="min-h-screen bg-crema p-8 text-xl font-bold text-cafe">Verificando sesión...</div>;
  }

  if (state === "blocked") {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
