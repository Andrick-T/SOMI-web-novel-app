import { useState } from "react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock as LockIcon,
  User,
} from "lucide-react";
import type { CommonProps } from "../types";

type Mode = "login" | "register" | "forgot";

export default function AuthPage({ navigate, onLogin }: CommonProps) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleSubmit = () => {
    setError("");
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    if (mode !== "forgot" && !password) {
      setError("Please enter your password.");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (mode === "register" && !name) {
      setError("Please enter your display name.");
      return;
    }

    setLoading(true);
    setTimeout(async () => {
      if (mode === "forgot") {
        setForgotSent(true);
        setLoading(false);
      } else {
        try {
          await onLogin({
            email,
            password,
            name: mode === "register" ? name : undefined,
          });
          navigate("home");
        } catch (caught) {
          setError(
            caught instanceof Error ? caught.message : "Unable to sign in.",
          );
        } finally {
          setLoading(false);
        }
      }
    }, 1200);
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#0d0b18" }}>
      {/* Background decoration */}
      <div
        className="absolute top-0 left-0 right-0 h-72 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(232,168,76,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Back button */}
      <div className="px-5 pt-12 relative">
        <button
          onClick={() => navigate("home")}
          className="w-9 h-9 flex items-center justify-center rounded-full active:scale-90"
          style={{ background: "#1a1726" }}
        >
          <ArrowLeft size={18} color="#f0ece4" />
        </button>
      </div>

      {/* Logo */}
      <div className="px-8 pt-8 pb-6 text-center">
        <h1 className="font-display text-3xl font-bold gold-shimmer">SOMI</h1>
        <p className="text-sm mt-1" style={{ color: "#8b7ea8" }}>
          Your story begins here
        </p>
      </div>

      {/* Mode tabs */}
      {mode !== "forgot" && (
        <div
          className="mx-5 mb-6 rounded-xl p-1 flex"
          style={{ background: "#1a1726", border: "1px solid #2e2945" }}
        >
          <button
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className="flex-1 h-9 rounded-lg text-sm font-bold transition-all"
            style={{
              background: mode === "login" ? "#231f35" : "transparent",
              color: mode === "login" ? "#e8a84c" : "#8b7ea8",
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setMode("register");
              setError("");
            }}
            className="flex-1 h-9 rounded-lg text-sm font-bold transition-all"
            style={{
              background: mode === "register" ? "#231f35" : "transparent",
              color: mode === "register" ? "#e8a84c" : "#8b7ea8",
            }}
          >
            Create Account
          </button>
        </div>
      )}

      {/* Form */}
      <div className="flex-1 px-5 flex flex-col">
        {mode === "forgot" && (
          <div className="mb-6">
            <button
              onClick={() => {
                setMode("login");
                setForgotSent(false);
              }}
              className="flex items-center gap-2 text-sm mb-4"
              style={{ color: "#8b7ea8" }}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </button>
            <h2
              className="font-display text-xl font-bold mb-1"
              style={{ color: "#f0ece4" }}
            >
              Reset Password
            </h2>
            <p className="text-sm" style={{ color: "#8b7ea8" }}>
              Enter your email and we'll send you a reset link.
            </p>
          </div>
        )}

        {forgotSent ? (
          <div className="flex flex-col items-center py-8 gap-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "rgba(232,168,76,0.15)" }}
            >
              <Mail size={28} color="#e8a84c" />
            </div>
            <p
              className="font-display text-lg text-center"
              style={{ color: "#f0ece4" }}
            >
              Check your email
            </p>
            <p className="text-sm text-center" style={{ color: "#8b7ea8" }}>
              We sent a password reset link to{" "}
              <strong style={{ color: "#f0ece4" }}>{email}</strong>
            </p>
            <button
              onClick={() => {
                setMode("login");
                setForgotSent(false);
              }}
              className="text-sm font-semibold"
              style={{ color: "#e8a84c" }}
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {mode === "register" && (
              <div>
                <label
                  className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
                  style={{ color: "#8b7ea8" }}
                >
                  Display Name
                </label>
                <div
                  className="flex items-center gap-3 rounded-xl px-4 h-12"
                  style={{ background: "#1a1726", border: "1px solid #2e2945" }}
                >
                  <User size={16} color="#8b7ea8" />
                  <input
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "#f0ece4" }}
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label
                className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
                style={{ color: "#8b7ea8" }}
              >
                Email
              </label>
              <div
                className="flex items-center gap-3 rounded-xl px-4 h-12"
                style={{ background: "#1a1726", border: "1px solid #2e2945" }}
              >
                <Mail size={16} color="#8b7ea8" />
                <input
                  type="email"
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: "#f0ece4" }}
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {mode !== "forgot" && (
              <div>
                <label
                  className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
                  style={{ color: "#8b7ea8" }}
                >
                  Password
                </label>
                <div
                  className="flex items-center gap-3 rounded-xl px-4 h-12"
                  style={{ background: "#1a1726", border: "1px solid #2e2945" }}
                >
                  <LockIcon size={16} color="#8b7ea8" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "#f0ece4" }}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? (
                      <EyeOff size={16} color="#8b7ea8" />
                    ) : (
                      <Eye size={16} color="#8b7ea8" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {mode === "register" && (
              <div>
                <label
                  className="text-[11px] font-semibold uppercase tracking-wider mb-1.5 block"
                  style={{ color: "#8b7ea8" }}
                >
                  Confirm Password
                </label>
                <div
                  className="flex items-center gap-3 rounded-xl px-4 h-12"
                  style={{ background: "#1a1726", border: "1px solid #2e2945" }}
                >
                  <LockIcon size={16} color="#8b7ea8" />
                  <input
                    type="password"
                    className="flex-1 bg-transparent text-sm outline-none"
                    style={{ color: "#f0ece4" }}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="px-3 py-2.5 rounded-xl text-sm"
                style={{
                  background: "rgba(201,96,58,0.12)",
                  color: "#c9603a",
                  border: "1px solid rgba(201,96,58,0.3)",
                }}
              >
                {error}
              </div>
            )}

            {/* Forgot password */}
            {mode === "login" && (
              <button
                onClick={() => {
                  setMode("forgot");
                  setError("");
                }}
                className="text-xs text-right"
                style={{ color: "#8b7ea8" }}
              >
                Forgot your password?
              </button>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-12 rounded-xl font-bold text-sm mt-2 flex items-center justify-center disabled:opacity-70 active:scale-95 transition-all"
              style={{ background: "#e8a84c", color: "#0d0b18" }}
            >
              {loading ? (
                <span className="anim-pulse-soft">
                  {mode === "login"
                    ? "Signing In..."
                    : mode === "register"
                      ? "Creating Account..."
                      : "Sending Link..."}
                </span>
              ) : mode === "login" ? (
                "Sign In"
              ) : mode === "register" ? (
                "Create Account"
              ) : (
                "Send Reset Link"
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px" style={{ background: "#2e2945" }} />
              <span className="text-xs" style={{ color: "#8b7ea8" }}>
                or continue as
              </span>
              <div className="flex-1 h-px" style={{ background: "#2e2945" }} />
            </div>

            {/* Guest option */}
            <button
              onClick={() => navigate("home")}
              className="w-full h-12 rounded-xl font-semibold text-sm active:scale-95 transition-all"
              style={{
                background: "#1a1726",
                color: "#8b7ea8",
                border: "1px solid #2e2945",
              }}
            >
              Browse as Guest
            </button>
          </div>
        )}
      </div>

      {/* Terms */}
      <div className="px-8 py-6 text-center">
        <p className="text-[10px]" style={{ color: "#8b7ea8" }}>
          By continuing, you agree to SOMI's{" "}
          <span style={{ color: "#e8a84c" }}>Terms of Service</span> and{" "}
          <span style={{ color: "#e8a84c" }}>Privacy Policy</span>.
        </p>
      </div>
    </div>
  );
}
