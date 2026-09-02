import { useMemo, useState } from "react";
import { Bell, ShieldCheck } from "lucide-react";
import { adminService, mockAdminRepository } from "../../features/admin";
import AdminActionDialog from "../../components/AdminActionDialog";
import { StatusBadge, Toggle } from "../../components/DesignPrimitives";
import type { CommonProps } from "../../types";

export default function AdminSettings({}: CommonProps) {
  const initialSettings = useMemo(() => mockAdminRepository.getPlatformSettings(), []);
  const [settings, setSettings] = useState(initialSettings);
  const [dialog, setDialog] = useState(false);

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  const toggle = (key: keyof typeof settings, value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveSettings = () => {
    adminService.updatePlatformSettings(settings);
    setDialog(false);
  };

  return (
    <div className="min-h-full bg-[var(--color-background)] px-5 py-8 text-[var(--color-text-primary)]">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Admin Console</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--color-text-primary)]">Settings</h1>
        </div>
        <StatusBadge label={hasChanges ? "Dirty" : "Clean"} tone={hasChanges ? "warning" : "success"} compact />
      </div>

      <div className="space-y-5 pb-8">
        <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Platform</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-[var(--color-text-secondary)]">
              <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Platform name</span>
              <input value={settings.platformName} className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none" />
            </label>
            <label className="text-sm text-[var(--color-text-secondary)]">
              <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Support email</span>
              <input value={settings.supportEmail} className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Content</h2>
          <div className="space-y-3">
            {[
              ["Moderation enabled", "moderationEnabled"],
              ["Writer registration enabled", "writerRegistrationEnabled"],
              ["Auto-publish enabled", "autoPublishEnabled"],
            ].map(([label, key]) => (
              <div key={key} className="flex w-full items-center justify-between rounded-xl bg-[var(--color-background)] px-3 py-3 text-left">
                <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
                <Toggle checked={Boolean(settings[key as keyof typeof settings])} onChange={(checked) => toggle(key as keyof typeof settings, checked)} label={String(label)} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">Economy</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-[var(--color-text-secondary)]">
              <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Coin conversion rate</span>
              <input value={settings.coinConversionRate} className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none" />
            </label>
            <label className="text-sm text-[var(--color-text-secondary)]">
              <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Minimum purchase</span>
              <input value={settings.minimumPurchase} className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none" />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]"><Bell size={14} color="var(--color-accent-primary)" /> Notifications</h2>
          <div className="space-y-3">
            {[
              ["Email notifications", "emailNotifications"],
              ["Moderation notifications", "moderationNotifications"],
              ["Payment notifications", "paymentNotifications"],
            ].map(([label, key]) => (
              <div key={key} className="flex w-full items-center justify-between rounded-xl bg-[var(--color-background)] px-3 py-3 text-left">
                <span className="text-sm text-[var(--color-text-secondary)]">{label}</span>
                <Toggle checked={Boolean(settings[key as keyof typeof settings])} onChange={(checked) => toggle(key as keyof typeof settings, checked)} label={String(label)} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-surface)] p-4">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]"><ShieldCheck size={14} color="var(--color-accent-primary)" /> Security</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm text-[var(--color-text-secondary)]">
              <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Session policy</span>
              <input value={settings.sessionPolicy} className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none" />
            </label>
            <label className="text-sm text-[var(--color-text-secondary)]">
              <span className="mb-1 block text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">Admin timeout</span>
              <input value={settings.adminSessionTimeoutMinutes} className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none" />
            </label>
          </div>
        </section>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => setSettings(initialSettings)} className="somi-control rounded-lg border border-[var(--color-border-default)] bg-[var(--color-background)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)]">
            Reset
          </button>
          <button type="button" onClick={() => setDialog(true)} className="somi-control rounded-lg bg-[var(--color-accent-primary)] px-3 py-2 text-xs font-semibold text-[var(--color-background)]">
            Save changes
          </button>
        </div>
      </div>

      <AdminActionDialog
        open={dialog}
        title="Apply settings"
        description="Save the updated platform controls and write the changes to the operational audit log."
        confirmLabel="Save settings"
        onConfirm={saveSettings}
        onCancel={() => setDialog(false)}
      />
    </div>
  );
}
