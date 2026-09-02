import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div
      className="flex min-h-full flex-col items-center justify-center px-6 text-center"
      style={{ background: "#0d0b18" }}
    >
      <div className="mb-5 rounded-full border border-[#2e2945] bg-[#1a1726] p-4">
        <ArrowLeft size={20} color="#e8a84c" />
      </div>
      <p
        className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em]"
        style={{ color: "#8b7ea8" }}
      >
        404
      </p>
      <h1
        className="font-display text-3xl font-bold"
        style={{ color: "#f0ece4" }}
      >
        This page is missing
      </h1>
      <p
        className="mt-3 max-w-sm text-sm leading-relaxed"
        style={{ color: "#8b7ea8" }}
      >
        The story you were looking for is not available in this chapter of the
        platform yet.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold"
        style={{ background: "#e8a84c", color: "#0d0b18" }}
      >
        Return home
      </Link>
    </div>
  );
}
