import { useState } from "react";
import { Bell, Shield, Globe, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import type { CommonProps } from "../../types";

type Toggle = {
  id: string;
  label: string;
  desc: string;
  value: boolean;
};

export default function AdminSettings({ }: CommonProps) {
  const [toggles, setToggles] = useState<Toggle[]>([
    { id: "maintenance",    label: "Maintenance Mode",      desc: "Redirect all users to maintenance page", value: false },
    { id: "newRegistration",label: "Allow New Registrations", desc: "Toggle user sign-up globally",         value: true },
    { id: "writerApply",    label: "Writer Applications",   desc: "Let readers apply to become writers",    value: true },
    { id: "pushNotifs",     label: "Push Notifications",    desc: "Platform-wide push dispatch",            value: true },
    { id: "emailDigest",    label: "Weekly Email Digest",   desc: "Send digest emails to active users",     value: false },
  ]);

  const toggle = (id: string) => {
    setToggles(prev => prev.map(t => t.id === id ? { ...t, value: !t.value } : t));
  };

  return (
    <div className="flex flex-col min-h-full" style={{ background: "#0e1422" }}>
      <div className="px-5 pt-12 pb-5">
        <p className="text-xs uppercase tracking-widest font-bold mb-0.5" style={{ color: "#60a5fa88" }}>Admin Console</p>
        <h1 className="font-display text-2xl font-bold" style={{ color: "#f0ece4" }}>Settings</h1>
      </div>

      {/* Platform toggles */}
      <div className="px-5 mb-6">
        <h3 className="font-display text-sm font-semibold mb-3" style={{ color: "#f0ece4" }}>Platform Controls</h3>
        <div className="flex flex-col gap-2">
          {toggles.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-4 rounded-xl"
              style={{ background: "#162035", border: "1px solid rgba(96,165,250,0.08)" }}
            >
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{ color: "#f0ece4" }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "#3b5278" }}>{item.desc}</p>
              </div>
              <button onClick={() => toggle(item.id)} className="flex-shrink-0">
                {item.value
                  ? <ToggleRight size={28} color="#60a5fa" />
                  : <ToggleLeft  size={28} color="#3b5278" />
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Config sections */}
      {[
        {
          title: "Notifications",
          icon: <Bell size={15} color="#60a5fa" />,
          items: ["Email Templates", "SMS Fallback Settings", "Notification Queue"],
        },
        {
          title: "Security",
          icon: <Shield size={15} color="#60a5fa" />,
          items: ["Two-Factor Auth Policy", "Session Timeout", "Rate Limit Rules", "Banned Words List"],
        },
        {
          title: "Localization",
          icon: <Globe size={15} color="#60a5fa" />,
          items: ["Supported Languages", "Default Currency", "Date & Time Format"],
        },
      ].map(section => (
        <div key={section.title} className="px-5 mb-5">
          <div className="flex items-center gap-2 mb-3">
            {section.icon}
            <h3 className="font-display text-sm font-semibold" style={{ color: "#f0ece4" }}>{section.title}</h3>
          </div>
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(96,165,250,0.1)" }}
          >
            {section.items.map((item, i) => (
              <button
                key={i}
                className="flex items-center justify-between w-full px-4 py-3 active:bg-white/5"
                style={{
                  background: "#162035",
                  borderBottom: i < section.items.length - 1 ? "1px solid rgba(96,165,250,0.08)" : "none",
                }}
              >
                <span className="text-sm" style={{ color: "#a0c0e8" }}>{item}</span>
                <ChevronRight size={14} color="#3b5278" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Danger zone */}
      <div className="px-5 mb-10">
        <h3 className="font-display text-sm font-semibold mb-3" style={{ color: "#fb7185" }}>Danger Zone</h3>
        <div className="flex flex-col gap-2">
          {[
            { label: "Flush CDN Cache",      sub: "Force assets to re-propagate" },
            { label: "Reset All Rate Limits", sub: "Unblock temporarily rate-limited IPs" },
            { label: "Export User Data",      sub: "Download full platform data archive" },
          ].map((item, i) => (
            <button
              key={i}
              className="flex items-center justify-between px-4 py-3.5 rounded-xl active:scale-[0.98]"
              style={{ background: "rgba(251,113,133,0.06)", border: "1px solid rgba(251,113,133,0.15)" }}
            >
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: "#fb7185" }}>{item.label}</p>
                <p className="text-xs mt-0.5" style={{ color: "#7a4055" }}>{item.sub}</p>
              </div>
              <ChevronRight size={14} color="#fb7185" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
