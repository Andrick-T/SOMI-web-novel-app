import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Bell,
  BookOpen,
  ChevronRight,
  Clock,
  Coins,
  Flame,
  Globe,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  LogOut,
  Moon,
  PenLine,
  Save,
  Shield,
  Star,
  X,
} from "lucide-react";

import { Toggle } from "../components/DesignPrimitives";
import type { CommonProps } from "../types";
import {
  profileApiRepository,
  type ProfileResponse,
} from "../services/repositories/profileApiRepository";

type ProfileMenuItem = {
  icon: ReactNode;
  label: string;
  value?: string;
  right?: ReactNode;
  chevron?: boolean;
  action?: () => void;
};

type ProfileMenuSection = {
  title: string;
  items: ProfileMenuItem[];
};

export default function ProfilePage({
  navigate,
  onLogout,
  isLoggedIn,
  isWriter,
  isAdmin,
  setEnvironment,
}: CommonProps) {
  const [profileData, setProfileData] = useState<
    ProfileResponse["profile"] | null
  >(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [editUsername, setEditUsername] = useState("");
  const [editDisplayName, setEditDisplayName] = useState("");
  const [editBio, setEditBio] = useState("");

  const [preferenceSaving, setPreferenceSaving] = useState<
    "notifications" | "darkMode" | null
  >(null);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("auth");
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await profileApiRepository.getProfile();

        if (!cancelled) {
          setProfileData(response.profile);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load your profile.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, navigate]);

  const openEdit = () => {
    if (!profileData) return;

    setEditUsername(profileData.user.username);
    setEditDisplayName(profileData.profile.displayName ?? "");
    setEditBio(profileData.profile.bio ?? "");
    setError(null);
    setIsEditing(true);
  };

  const closeEdit = () => {
    if (isSaving) return;

    setIsEditing(false);
  };

  const saveProfile = async () => {
    if (!profileData) return;

    const originalUsername = profileData.user.username;
    const username = editUsername.trim();
    const displayName = editDisplayName.trim();
    const bio = editBio.trim();

    const usernameChanged = username !== originalUsername;

    if (usernameChanged) {
      if (username.length < 3) {
        setError("Username must contain at least 3 characters.");
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError(
          "Username can only contain letters, numbers, and underscores.",
        );
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload: {
        username?: string;
        displayName: string | null;
        bio: string | null;
      } = {
        displayName: displayName || null,
        bio: bio || null,
      };

      if (usernameChanged) {
        payload.username = username;
      }

      const response = await profileApiRepository.updateProfile(payload);

      setProfileData(response.profile);
      setIsEditing(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to save your profile.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = async (
    key: "notifications" | "darkMode",
    value: boolean,
  ) => {
    if (!profileData) return;

    const previousPreferences = profileData.profile.preferences;

    setProfileData((current) =>
      current
        ? {
            ...current,
            profile: {
              ...current.profile,
              preferences: {
                ...current.profile.preferences,
                [key]: value,
              },
            },
          }
        : current,
    );

    setPreferenceSaving(key);
    setError(null);

    try {
      const response = await profileApiRepository.updateProfile({
        preferences: {
          [key]: value,
        },
      });

      setProfileData(response.profile);
    } catch (caught) {
      setProfileData((current) =>
        current
          ? {
              ...current,
              profile: {
                ...current.profile,
                preferences: previousPreferences,
              },
            }
          : current,
      );

      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update this preference.",
      );
    } finally {
      setPreferenceSaving(null);
    }
  };

  const initials = useMemo(() => {
    if (!profileData) return "?";

    const name =
      profileData.profile.displayName?.trim() ||
      profileData.user.username ||
      "SOMI";

    return name.charAt(0).toUpperCase();
  }, [profileData]);

  if (!isLoggedIn) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--color-background)] px-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2
            size={28}
            className="animate-spin text-[var(--color-accent-primary)]"
          />

          <p className="text-sm text-[var(--color-text-muted)]">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--color-background)] px-5">
        <div className="somi-state">
          <AlertCircle
            size={28}
            className="text-[var(--color-status-danger)]"
          />

          <h2>Unable to load profile</h2>

          <p>{error ?? "Something went wrong while loading your profile."}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="somi-control mt-2 rounded-lg bg-[var(--color-accent-primary)] px-4 py-2 text-xs font-bold text-[var(--color-background)]"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { user, profile, wallet, stats, readingGenres } = profileData;

  const darkMode = profile.preferences.darkMode ?? true;
  const notifications = profile.preferences.notifications ?? true;

  const statsItems = [
    {
      label: "Books Read",
      value: stats.booksRead.toLocaleString(),
      icon: <BookOpen size={17} />,
    },
    {
      label: "Hours Read",
      value: stats.readingHours.toLocaleString(),
      icon: <Clock size={17} />,
    },
    {
      label: "Day Streak",
      value: stats.dayStreak.toLocaleString(),
      icon: <Flame size={17} />,
    },
    {
      label: "Avg Rating",
      value:
        stats.averageRating === null ? "—" : stats.averageRating.toFixed(1),
      icon: <Star size={17} />,
    },
  ];

  const menuSections: ProfileMenuSection[] = [
    {
      title: "Preferences",
      items: [
        {
          icon: <Bell size={18} />,
          label: "Notifications",
          right: (
            <div className="somi-settings-control">
              {preferenceSaving === "notifications" && (
                <Loader2
                  size={13}
                  className="animate-spin text-[var(--color-accent-primary)]"
                />
              )}

              <Toggle
                checked={notifications}
                onChange={(checked) =>
                  void updatePreference("notifications", checked)
                }
                label="Toggle notifications"
                disabled={preferenceSaving !== null}
              />
            </div>
          ),
        },
        {
          icon: <Moon size={18} />,
          label: "Dark Mode",
          right: (
            <div className="somi-settings-control">
              {preferenceSaving === "darkMode" && (
                <Loader2
                  size={13}
                  className="animate-spin text-[var(--color-accent-primary)]"
                />
              )}

              <Toggle
                checked={darkMode}
                onChange={(checked) =>
                  void updatePreference("darkMode", checked)
                }
                label="Toggle dark mode"
                disabled={preferenceSaving !== null}
              />
            </div>
          ),
        },
        {
          icon: <Globe size={18} />,
          label: "Language",
          value: profile.preferences.language === "fr" ? "French" : "English",
          chevron: true,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          icon: <Coins size={18} />,
          label: "SOMI Wallet",
          value: `${wallet.balance.toLocaleString()} coins`,
          chevron: true,
          action: () => navigate("wallet"),
        },
        {
          icon: <Shield size={18} />,
          label: "Privacy & Security",
          chevron: true,
        },
        {
          icon: <HelpCircle size={18} />,
          label: "Help & Support",
          chevron: true,
        },
      ],
    },
  ];

  return (
    <div className="somi-app-page">
      <main className="somi-app-inner">
        {/* Page header */}
        <header className="somi-page-header">
          <p className="somi-page-eyebrow">Profile</p>

          <h1 className="somi-page-title">Your reading life</h1>

          <p className="somi-page-description">
            Manage your profile, preferences and reading activity.
          </p>
        </header>

        {/* Error */}
        {error && (
          <div className="mt-5 somi-app-error">
            <AlertCircle
              size={17}
              className="mt-0.5 shrink-0 text-[var(--color-status-danger)]"
            />

            <p className="min-w-0 flex-1 leading-5">{error}</p>

            <button
              type="button"
              onClick={() => setError(null)}
              className="shrink-0 text-[var(--color-text-muted)]"
              aria-label="Dismiss error"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {/* Identity */}
        <section className="somi-section">
          <div className="somi-profile-identity">
            <div className="somi-profile-avatar">
              {profile.avatar ? (
                <img src={profile.avatar} alt="" />
              ) : (
                <div className="somi-profile-avatar-fallback">{initials}</div>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="somi-profile-name">
                {profile.displayName || user.username}
              </h2>

              <p className="somi-profile-handle">@{user.username}</p>

              <p className="somi-profile-email">{user.email}</p>

              <div className="somi-profile-wallet">
                <Coins size={12} />

                <span>{wallet.balance.toLocaleString()} Somi Coins</span>
              </div>

              {profile.bio && <p className="somi-profile-bio">{profile.bio}</p>}
            </div>

            <button
              type="button"
              onClick={openEdit}
              className="somi-editorial-button"
            >
              Edit profile
            </button>
          </div>
        </section>

        {/* Reading activity */}
        <section className="somi-section">
          <div className="somi-section-header">
            <h2 className="somi-section-title">Reading activity</h2>

            <span className="somi-section-label">Your statistics</span>
          </div>

          <div className="somi-data-grid">
            {statsItems.map((stat) => (
              <div key={stat.label} className="somi-data-item">
                <div
                  className="somi-data-icon"
                  style={{ color: "var(--color-accent-primary)" }}
                >
                  {stat.icon}
                </div>

                <div className="somi-data-value">{stat.value}</div>

                <div className="somi-data-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Reading world */}
        <section className="somi-section">
          <div className="somi-section-header">
            <h2 className="somi-section-title">Your reading world</h2>

            <span className="somi-section-label">Favorite genres</span>
          </div>

          <div className="somi-reading-world">
            <div>
              {readingGenres.length === 0 ? (
                <div className="somi-reading-empty">
                  <BookOpen size={19} />

                  <p>Start reading to build your genre profile.</p>
                </div>
              ) : (
                <div className="somi-genre-list">
                  {readingGenres.map(({ genre, pct }) => (
                    <div key={genre} className="somi-genre-row">
                      <span className="somi-genre-name">{genre}</span>

                      <div className="somi-genre-track">
                        <div
                          className="somi-genre-fill"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <span className="somi-genre-pct">{pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="hidden md:block">
              <p className="somi-page-eyebrow">SOMI</p>

              <p className="font-serif text-sm leading-7 text-[var(--color-text-secondary)]">
                Your reading history shapes this profile as you discover new
                stories and return to old favorites.
              </p>
            </div>
          </div>
        </section>

        {/* Preferences / account */}
        <section className="somi-section">
          {menuSections.map((section) => (
            <div key={section.title} className="mb-10 last:mb-0">
              <div className="somi-section-header">
                <h2 className="somi-section-title">{section.title}</h2>
              </div>

              <div className="somi-settings-list">
                {section.items.map((item) => {
                  const content = (
                    <>
                      <div className="somi-settings-icon text-[var(--color-text-muted)]">
                        {item.icon}
                      </div>

                      <div className="somi-settings-content">
                        <div className="somi-settings-label">{item.label}</div>

                        {item.value && (
                          <div className="somi-settings-value">
                            {item.value}
                          </div>
                        )}
                      </div>

                      {item.right ? (
                        <div className="somi-settings-control">
                          {item.right}
                        </div>
                      ) : item.chevron ? (
                        <ChevronRight
                          size={17}
                          className="somi-settings-chevron"
                        />
                      ) : null}
                    </>
                  );

                  if (item.action) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={item.action}
                        className="somi-settings-row is-action"
                      >
                        {content}
                      </button>
                    );
                  }

                  return (
                    <div key={item.label} className="somi-settings-row">
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Writer / Admin */}
        {(isWriter || isAdmin) && (
          <section className="somi-section">
            <div className="somi-section-header">
              <h2 className="somi-section-title">Environments</h2>

              <span className="somi-section-label">Professional tools</span>
            </div>

            <div className="somi-environment-list">
              {isWriter && (
                <button
                  type="button"
                  onClick={() => {
                    setEnvironment("writer");
                    navigate("writer-dashboard");
                  }}
                  className="somi-environment-item"
                >
                  <div
                    className="somi-environment-icon"
                    style={{ color: "#4ade80" }}
                  >
                    <PenLine size={19} />
                  </div>

                  <div className="somi-environment-content">
                    <p
                      className="somi-environment-title"
                      style={{ color: "#4ade80" }}
                    >
                      Writer Studio
                    </p>

                    <p className="somi-environment-description">
                      Manage your books and chapters
                    </p>
                  </div>

                  <ChevronRight size={17} style={{ color: "#4ade80" }} />
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setEnvironment("admin");
                    navigate("admin-dashboard");
                  }}
                  className="somi-environment-item"
                >
                  <div
                    className="somi-environment-icon"
                    style={{ color: "#60a5fa" }}
                  >
                    <LayoutDashboard size={19} />
                  </div>

                  <div className="somi-environment-content">
                    <p
                      className="somi-environment-title"
                      style={{ color: "#60a5fa" }}
                    >
                      Admin Console
                    </p>

                    <p className="somi-environment-description">
                      Platform management
                    </p>
                  </div>

                  <ChevronRight size={17} style={{ color: "#60a5fa" }} />
                </button>
              )}
            </div>
          </section>
        )}

        {/* Logout */}
        <section className="somi-section border-t border-[var(--color-border-default)] pt-6">
          <button
            type="button"
            onClick={() => {
              void onLogout();
              navigate("home");
            }}
            className="somi-logout"
          >
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </section>
      </main>

      {/* Edit profile modal */}
      {isEditing && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm md:items-center"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEdit();
            }
          }}
        >
          <div className="w-full max-w-lg rounded-[1.25rem] border border-[var(--color-border-default)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-surface)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-[var(--color-text-primary)]">
                  Edit profile
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  Update the information shown on your SOMI profile.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                disabled={isSaving}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                aria-label="Close edit profile"
              >
                <X size={17} />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[var(--color-text-secondary)]">
                  Username
                </span>

                <input
                  value={editUsername}
                  onChange={(event) => setEditUsername(event.target.value)}
                  maxLength={30}
                  disabled={isSaving}
                  className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-background)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-accent-primary)]"
                  placeholder="username"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[var(--color-text-secondary)]">
                  Display name
                </span>

                <input
                  value={editDisplayName}
                  onChange={(event) => setEditDisplayName(event.target.value)}
                  maxLength={100}
                  disabled={isSaving}
                  className="w-full rounded-xl border border-[var(--color-border-default)] bg-[var(--color-background)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-accent-primary)]"
                  placeholder="Your display name"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-[var(--color-text-secondary)]">
                  Bio
                </span>

                <textarea
                  value={editBio}
                  onChange={(event) => setEditBio(event.target.value)}
                  maxLength={500}
                  rows={4}
                  disabled={isSaving}
                  className="w-full resize-none rounded-xl border border-[var(--color-border-default)] bg-[var(--color-background)] px-3 py-2.5 text-sm leading-6 text-[var(--color-text-primary)] outline-none transition focus:border-[var(--color-accent-primary)]"
                  placeholder="Tell readers a little about yourself..."
                />

                <div className="mt-1 text-right text-[10px] text-[var(--color-text-muted)]">
                  {editBio.length}/500
                </div>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                disabled={isSaving}
                className="rounded-xl border border-[var(--color-border-default)] px-4 py-2.5 text-xs font-bold text-[var(--color-text-secondary)]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void saveProfile()}
                disabled={isSaving}
                className="flex items-center gap-2 rounded-xl bg-[var(--color-accent-primary)] px-4 py-2.5 text-xs font-bold text-[var(--color-background)] disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}

                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
