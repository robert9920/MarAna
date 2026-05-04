import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { DEMO_MODE, adminApi } from "../../lib/api.js";

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminApi.login(form);
      window.localStorage.setItem("marana_admin_demo_session", "ok");
      navigate("/admin");
    } catch {
      if (DEMO_MODE && form.username && form.password) {
        window.localStorage.setItem("marana_admin_demo_session", "ok");
        navigate("/admin");
      } else {
        setError("Usuario o contraseña incorrectos.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-crema px-4 py-8">
      <section className="panel w-full max-w-md p-5">
        <div className="mb-5 text-center">
          <img src="/logo.png" alt="Mar&Ana" className="mx-auto h-14 w-24 object-contain" />
          <h1 className="mt-3 text-2xl font-black text-cafe">Ingreso Admin</h1>
          <p className="mt-1 text-sm text-stone-600">Gestiona productos, stock y ventas.</p>
        </div>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <label>
            <span className="form-label">Usuario</span>
            <input
              className="form-input"
              value={form.username}
              onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))}
              autoComplete="username"
              required
            />
          </label>
          <label>
            <span className="form-label">Contraseña</span>
            <input
              className="form-input"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              autoComplete="current-password"
              type="password"
              required
            />
          </label>
          {error ? <p className="rounded-lg bg-red-100 p-3 font-bold text-red-800">{error}</p> : null}
          <button className="btn-primary" disabled={loading} type="submit">
            <Lock className="h-4 w-4" />
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </section>
    </main>
  );
}
