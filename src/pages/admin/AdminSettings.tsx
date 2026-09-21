import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Mail,
  Save,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  WalletCards,
  Wrench,
} from "lucide-react";
import { mockAdminRepository } from "../../features/admin/repository.ts";
import type { PlatformSettings } from "../../features/admin/types";

type BooleanSettingKey =
  | "maintenanceMode"
  | "moderationEnabled"
  | "writerRegistrationEnabled"
  | "autoPublishEnabled"
  | "emailNotifications"
  | "moderationNotifications"
  | "paymentNotifications"
  | "suspiciousActivityMonitoring";

function SettingToggle({
  checked,
  onChange,
  label,
  description,
  danger = false,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description: string;
  danger?: boolean;
}) {
  return (
    <label className={`somi-admin-setting-toggle${danger ? " is-danger" : ""}`}>
      <span className="somi-admin-setting-toggle-copy">
        <span className="somi-admin-setting-toggle-label">{label}</span>
        <span className="somi-admin-setting-toggle-description">
          {description}
        </span>
      </span>

      <span className="somi-admin-switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="somi-admin-switch-track" aria-hidden="true">
          <span className="somi-admin-switch-thumb" />
        </span>
      </span>
    </label>
  );
}

function SettingSection({
  icon,
  eyebrow,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="somi-admin-settings-section">
      <div className="somi-admin-settings-section-header">
        <div className="somi-admin-settings-section-icon">{icon}</div>

        <div>
          <p className="somi-admin-eyebrow">{eyebrow}</p>
          <h2 className="somi-admin-section-title">{title}</h2>
          <p className="somi-admin-section-description">{description}</p>
        </div>
      </div>

      <div className="somi-admin-settings-section-body">{children}</div>
    </section>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(() =>
    mockAdminRepository.getPlatformSettings(),
  );
  const [savedSettings, setSavedSettings] = useState<PlatformSettings>(() =>
    mockAdminRepository.getPlatformSettings(),
  );
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const current = mockAdminRepository.getPlatformSettings();
    setSettings(current);
    setSavedSettings(current);
  }, []);

  const hasChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSettings),
    [settings, savedSettings],
  );

  const updateSetting = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setSaved(false);
  };

  const updateBooleanSetting = (key: BooleanSettingKey, value: boolean) => {
    updateSetting(key, value);
  };

  const handleSave = () => {
    const updated = mockAdminRepository.updatePlatformSettings(settings);
    setSettings(updated);
    setSavedSettings(updated);
    setSaved(true);
  };

  const handleReset = () => {
    const current = mockAdminRepository.getPlatformSettings();
    setSettings(current);
    setSavedSettings(current);
    setSaved(false);
  };

  return (
    <div className="somi-admin-page somi-admin-settings-page">
      <div className="somi-admin-inner">
        <header className="somi-admin-header">
          <div>
            <p className="somi-admin-eyebrow">Configuration</p>
            <h1 className="somi-admin-title">Platform settings</h1>
            <p className="somi-admin-description">
              Manage the operational rules, economy defaults, notifications, and
              administrative security settings that shape SOMI.
            </p>
          </div>

          <div className="somi-admin-header-actions">
            {hasChanges && (
              <button
                type="button"
                className="somi-admin-button somi-admin-button-secondary"
                onClick={handleReset}
              >
                Discard changes
              </button>
            )}

            <button
              type="button"
              className="somi-admin-button somi-admin-button-primary"
              onClick={handleSave}
              disabled={!hasChanges}
            >
              <Save size={16} />
              {saved && !hasChanges ? "Saved" : "Save changes"}
            </button>
          </div>
        </header>

        {saved && !hasChanges && (
          <div className="somi-admin-notice somi-admin-notice-success">
            <Check size={17} />
            <div>
              <strong>Settings saved.</strong>
              <span>
                The current configuration has been stored in the admin
                repository.
              </span>
            </div>
          </div>
        )}

        {settings.maintenanceMode && (
          <div className="somi-admin-notice somi-admin-notice-warning">
            <AlertTriangle size={18} />
            <div>
              <strong>Maintenance mode is enabled.</strong>
              <span>
                This setting is intended for controlled operational
                interruptions and should not be enabled casually.
              </span>
            </div>
          </div>
        )}

        <div className="somi-admin-settings-layout">
          <main className="somi-admin-settings-main">
            <SettingSection
              icon={<Settings2 size={19} />}
              eyebrow="Platform"
              title="General configuration"
              description="Basic public-facing platform identity and support information."
            >
              <div className="somi-admin-form-grid">
                <label className="somi-admin-field">
                  <span className="somi-admin-field-label">Platform name</span>
                  <input
                    type="text"
                    value={settings.platformName}
                    onChange={(event) =>
                      updateSetting("platformName", event.target.value)
                    }
                    className="somi-admin-input"
                  />
                </label>

                <label className="somi-admin-field">
                  <span className="somi-admin-field-label">Support email</span>
                  <div className="somi-admin-input-with-icon">
                    <Mail size={16} />
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(event) =>
                        updateSetting("supportEmail", event.target.value)
                      }
                      className="somi-admin-input"
                    />
                  </div>
                </label>
              </div>
            </SettingSection>

            <SettingSection
              icon={<SlidersHorizontal size={19} />}
              eyebrow="Content"
              title="Publishing and moderation"
              description="Control how writers enter the platform and how content moves through moderation."
            >
              <div className="somi-admin-settings-list">
                <SettingToggle
                  label="Content moderation"
                  description="Keep moderation controls active for submitted books and chapters."
                  checked={settings.moderationEnabled}
                  onChange={(value) =>
                    updateBooleanSetting("moderationEnabled", value)
                  }
                />

                <SettingToggle
                  label="Writer registration"
                  description="Allow new users to register as writers."
                  checked={settings.writerRegistrationEnabled}
                  onChange={(value) =>
                    updateBooleanSetting("writerRegistrationEnabled", value)
                  }
                />

                <SettingToggle
                  label="Automatic publishing"
                  description="Allow eligible content to bypass the normal manual publishing step."
                  checked={settings.autoPublishEnabled}
                  onChange={(value) =>
                    updateBooleanSetting("autoPublishEnabled", value)
                  }
                />
              </div>

              <div className="somi-admin-field somi-admin-field-spaced">
                <span className="somi-admin-field-label">
                  Chapter pricing rules
                </span>
                <textarea
                  value={settings.chapterPricingRules}
                  onChange={(event) =>
                    updateSetting("chapterPricingRules", event.target.value)
                  }
                  className="somi-admin-textarea"
                  rows={4}
                />
                <span className="somi-admin-field-help">
                  Internal operational guidance for premium chapter pricing.
                </span>
              </div>
            </SettingSection>

            <SettingSection
              icon={<WalletCards size={19} />}
              eyebrow="Economy"
              title="Coins and purchases"
              description="Define the platform-level defaults used by SOMI's virtual economy."
            >
              <div className="somi-admin-form-grid">
                <label className="somi-admin-field">
                  <span className="somi-admin-field-label">
                    Coin conversion rate
                  </span>
                  <div className="somi-admin-input-with-suffix">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.coinConversionRate}
                      onChange={(event) =>
                        updateSetting(
                          "coinConversionRate",
                          Number(event.target.value),
                        )
                      }
                      className="somi-admin-input"
                    />
                    <span>coins</span>
                  </div>
                  <span className="somi-admin-field-help">
                    Current repository value: coins represented per configured
                    monetary unit.
                  </span>
                </label>

                <label className="somi-admin-field">
                  <span className="somi-admin-field-label">
                    Minimum purchase
                  </span>
                  <div className="somi-admin-input-with-suffix">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings.minimumPurchase}
                      onChange={(event) =>
                        updateSetting(
                          "minimumPurchase",
                          Number(event.target.value),
                        )
                      }
                      className="somi-admin-input"
                    />
                    <span>minimum</span>
                  </div>
                  <span className="somi-admin-field-help">
                    Minimum purchase threshold configured by the platform.
                  </span>
                </label>
              </div>
            </SettingSection>

            <SettingSection
              icon={<Mail size={19} />}
              eyebrow="Notifications"
              title="Administrative notifications"
              description="Choose which operational events should generate platform notifications."
            >
              <div className="somi-admin-settings-list">
                <SettingToggle
                  label="Email notifications"
                  description="Allow general platform notifications to be sent by email."
                  checked={settings.emailNotifications}
                  onChange={(value) =>
                    updateBooleanSetting("emailNotifications", value)
                  }
                />

                <SettingToggle
                  label="Moderation notifications"
                  description="Notify administrators about moderation-related events."
                  checked={settings.moderationNotifications}
                  onChange={(value) =>
                    updateBooleanSetting("moderationNotifications", value)
                  }
                />

                <SettingToggle
                  label="Payment notifications"
                  description="Notify administrators about important payment events."
                  checked={settings.paymentNotifications}
                  onChange={(value) =>
                    updateBooleanSetting("paymentNotifications", value)
                  }
                />
              </div>
            </SettingSection>

            <SettingSection
              icon={<ShieldCheck size={19} />}
              eyebrow="Security"
              title="Sessions and monitoring"
              description="Define administrative session behavior and suspicious-activity monitoring."
            >
              <div className="somi-admin-form-grid">
                <label className="somi-admin-field">
                  <span className="somi-admin-field-label">Session policy</span>
                  <input
                    type="text"
                    value={settings.sessionPolicy}
                    onChange={(event) =>
                      updateSetting("sessionPolicy", event.target.value)
                    }
                    className="somi-admin-input"
                  />
                </label>

                <label className="somi-admin-field">
                  <span className="somi-admin-field-label">
                    Admin session timeout
                  </span>
                  <div className="somi-admin-input-with-suffix">
                    <input
                      type="number"
                      min="5"
                      step="5"
                      value={settings.adminSessionTimeoutMinutes}
                      onChange={(event) =>
                        updateSetting(
                          "adminSessionTimeoutMinutes",
                          Number(event.target.value),
                        )
                      }
                      className="somi-admin-input"
                    />
                    <span>minutes</span>
                  </div>
                </label>
              </div>

              <div className="somi-admin-settings-list somi-admin-settings-list-spaced">
                <SettingToggle
                  label="Suspicious activity monitoring"
                  description="Keep administrative monitoring for potentially unusual platform activity."
                  checked={settings.suspiciousActivityMonitoring}
                  onChange={(value) =>
                    updateBooleanSetting("suspiciousActivityMonitoring", value)
                  }
                />
              </div>
            </SettingSection>

            <SettingSection
              icon={<Wrench size={19} />}
              eyebrow="Operations"
              title="Maintenance"
              description="Control whether the platform is temporarily placed into maintenance mode."
            >
              <SettingToggle
                label="Maintenance mode"
                description="Place the platform into a controlled maintenance state."
                checked={settings.maintenanceMode}
                onChange={(value) =>
                  updateBooleanSetting("maintenanceMode", value)
                }
                danger
              />

              <div className="somi-admin-settings-warning">
                <AlertTriangle size={16} />
                <span>
                  Maintenance mode is an operational switch. Changing it here
                  updates the stored platform setting but does not itself
                  implement a maintenance page or service shutdown.
                </span>
              </div>
            </SettingSection>
          </main>

          <aside className="somi-admin-settings-aside">
            <div className="somi-admin-settings-aside-block">
              <p className="somi-admin-eyebrow">Configuration state</p>
              <h2 className="somi-admin-aside-title">
                {hasChanges ? "Unsaved changes" : "All changes saved"}
              </h2>
              <p className="somi-admin-aside-description">
                {hasChanges
                  ? "Review the modified settings and save them when you are ready."
                  : "The page currently matches the platform configuration stored by the repository."}
              </p>

              <div
                className={`somi-admin-settings-state ${
                  hasChanges
                    ? "somi-admin-settings-state-pending"
                    : "somi-admin-settings-state-saved"
                }`}
              >
                <span className="somi-admin-settings-state-dot" />
                {hasChanges ? "Pending save" : "Configuration synchronized"}
              </div>
            </div>

            <div className="somi-admin-settings-aside-block">
              <p className="somi-admin-eyebrow">Operational principle</p>
              <p className="somi-admin-aside-note">
                Settings should define platform behavior without becoming a
                substitute for dedicated moderation, economy, or audit
                workflows.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
