"use client";

import {
  AuthApiError,
  type AuthzPermission,
  type AuthzRoleDetail,
  type AuthzRoleSummary,
  type AuthzUserWithRoles,
  authzApi,
  useAuth,
} from "@farmdb/api-client";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "../_components/app-shell";

const SETTINGS_CATEGORIES = [
  {
    key: "profile",
    label: "Profile & account",
    d: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  },
  {
    key: "farm",
    label: "Farm details",
    d: "M12 20v-8M12 12c-1-4-4-6-8-5 1 4 4 6 8 5zM12 11c1-3.5 4-5 8-4.5-1 3.5-4 5-8 4.5z",
  },
  {
    key: "access",
    label: "Access control",
    d: "M12 3l8 3.5v5c0 4.4-3.2 8.3-8 9.5-4.8-1.2-8-5.1-8-9.5v-5zM9.5 12l1.9 1.9 3.6-3.6",
  },
  {
    key: "notify",
    label: "Notifications",
    d: "M6 8a6 6 0 1112 0c0 6 3 8 3 8H3s3-2 3-8M10 21a2 2 0 004 0",
  },
  {
    key: "integrations",
    label: "Integrations & API",
    d: "M8 8l-3 3a4.2 4.2 0 006 6l3-3M16 16l3-3a4.2 4.2 0 00-6-6l-3 3",
  },
  {
    key: "backups",
    label: "Backups & restore",
    d: "M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7",
  },
];

const TILE = "linear-gradient(150deg,#4a8a54,#2c5a38)";

function initials(name: string | null, email: string): string {
  const base = (name || email).trim();
  const p = base.split(/\s+/);
  return (p.length >= 2 ? p[0][0] + p[1][0] : base.slice(0, 2)).toUpperCase();
}

function CatIcon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px] flex-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

function Check({ on }: { on: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3"
      fill="none"
      stroke="#f4ead4"
      strokeWidth="3.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: on ? 1 : 0 }}
      aria-hidden="true"
    >
      <path d="M5 13l4 4 10-10" />
    </svg>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();

  const [category, setCategory] = useState("access");
  const [tab, setTab] = useState<"roles" | "users" | "matrix">("roles");

  const [permissions, setPermissions] = useState<AuthzPermission[]>([]);
  const [roles, setRoles] = useState<AuthzRoleSummary[]>([]);
  const [users, setUsers] = useState<AuthzUserWithRoles[]>([]);
  const [selectedRole, setSelectedRole] = useState<AuthzRoleDetail | null>(null);
  const [draftPerms, setDraftPerms] = useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push("/login");
  }, [authLoading, isAuthenticated, router]);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const runError = useCallback(
    (e: unknown) => setError(e instanceof AuthApiError ? e.message : "Something went wrong"),
    [],
  );

  const loadAll = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const [perms, rs, us] = await Promise.all([
        authzApi.listPermissions(accessToken),
        authzApi.listRoles(accessToken),
        authzApi.listUsers(accessToken),
      ]);
      setPermissions(perms);
      setRoles(rs);
      setUsers(us);
    } catch (e) {
      runError(e);
    } finally {
      setLoading(false);
    }
  }, [accessToken, runError]);

  useEffect(() => {
    if (isAuthenticated && accessToken) loadAll();
  }, [isAuthenticated, accessToken, loadAll]);

  const groups = useMemo(() => {
    const map = new Map<string, AuthzPermission[]>();
    for (const p of permissions) {
      const g = p.group ?? "Other";
      if (!map.has(g)) map.set(g, []);
      map.get(g)?.push(p);
    }
    return [...map.entries()].map(([name, items]) => ({ name, items }));
  }, [permissions]);

  const openRole = async (id: string) => {
    if (!accessToken) return;
    setError(null);
    try {
      const detail = await authzApi.getRole(accessToken, id);
      setSelectedRole(detail);
      setDraftPerms(new Set(detail.permissions));
    } catch (e) {
      runError(e);
    }
  };

  const saveRole = async () => {
    if (!accessToken || !selectedRole) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await authzApi.setRolePermissions(accessToken, selectedRole.id, [
        ...draftPerms,
      ]);
      setSelectedRole(updated);
      setDraftPerms(new Set(updated.permissions));
      await loadAll();
      flash("Role saved");
    } catch (e) {
      runError(e);
    } finally {
      setBusy(false);
    }
  };

  const toggleAssignment = async (userId: string, roleId: string, has: boolean) => {
    if (!accessToken) return;
    setError(null);
    try {
      if (has) await authzApi.revokeRole(accessToken, userId, roleId);
      else await authzApi.assignRole(accessToken, userId, roleId);
      await loadAll();
      if (selectedRole) await openRole(selectedRole.id);
      flash(has ? "Role removed" : "Role assigned");
    } catch (e) {
      runError(e);
    }
  };

  const toggleMatrixCell = async (role: AuthzRoleSummary, permName: string, has: boolean) => {
    if (!accessToken || role.is_locked) return;
    setError(null);
    const next = new Set(role.permissions);
    if (has) next.delete(permName);
    else next.add(permName);
    try {
      await authzApi.setRolePermissions(accessToken, role.id, [...next]);
      await loadAll();
      flash("Matrix updated");
    } catch (e) {
      runError(e);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e5] text-[#957a5c]">
        Loading…
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f2e5] text-[#957a5c]">
        Redirecting…
      </div>
    );
  }

  const subNav: Array<{ key: typeof tab; label: string; count: number }> = [
    { key: "roles", label: "Roles", count: roles.length },
    { key: "users", label: "Users", count: users.length },
    { key: "matrix", label: "Permissions", count: permissions.length },
  ];

  return (
    <AppShell
      active="settings"
      eyebrow="Settings"
      title="Access control"
      topRight={
        <span className="rounded-lg bg-[#efe7d6] px-2.5 py-1 font-mono text-[11px] text-[#7a634a]">
          RBAC · self-hosted
        </span>
      }
    >
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-start gap-5 md:grid-cols-[220px_1fr]">
        {/* Category rail */}
        <nav className="flex flex-row gap-0.5 overflow-x-auto md:sticky md:top-0 md:flex-col">
          {SETTINGS_CATEGORIES.map((c) => {
            const on = c.key === category;
            return (
              <div key={c.key}>
                <button
                  type="button"
                  onClick={() => setCategory(c.key)}
                  className={`flex w-full items-center gap-[11px] rounded-[10px] border px-3 py-2.5 text-left text-[13.5px] font-semibold ${
                    on
                      ? "border-[#e2d3b6] bg-[#f1e7d3] text-[#20160f]"
                      : "border-transparent bg-transparent text-[#5f4a34] hover:bg-[#fcf8f0]"
                  }`}
                >
                  <CatIcon d={c.d} />
                  <span className="whitespace-nowrap">{c.label}</span>
                </button>
                {on && c.key === "access" ? (
                  <div className="my-1 ml-3.5 flex flex-row gap-1 border-[#eadfcb] pl-3 md:flex-col md:border-l">
                    {subNav.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => {
                          setTab(s.key);
                          setSelectedRole(null);
                        }}
                        className={`flex items-center gap-2 whitespace-nowrap rounded-[9px] px-2.5 py-2 text-[13px] ${
                          tab === s.key && !selectedRole
                            ? "bg-[#f4ead4] font-semibold text-[#20160f]"
                            : "font-medium text-[#5f4a34] hover:bg-[#f4ead4]"
                        }`}
                      >
                        <span>{s.label}</span>
                        <span className="ml-auto font-mono text-[10.5px] opacity-70">
                          {s.count}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        {/* Content */}
        <div className="flex min-w-0 flex-col gap-[18px]">
          {error ? (
            <div className="rounded-lg border border-[#eccfbe] bg-[#fbeee7] px-3.5 py-2.5 text-[13px] text-[#8a3f1e]">
              {error}
            </div>
          ) : null}

          {category !== "access" ? (
            <div className="rounded-[10px] border border-dashed border-[#d8c9a9] bg-[#fcf8f0] p-6 text-[#957a5c]">
              <div className="font-serif text-[17px] font-semibold text-[#3f2d22]">
                {SETTINGS_CATEGORIES.find((c) => c.key === category)?.label}
              </div>
              <p className="mt-1.5 text-[13px]">This section isn’t part of this build yet.</p>
            </div>
          ) : loading ? (
            <div className="rounded-[10px] border border-[#eadfcb] bg-white p-6 text-[#957a5c]">
              Loading access control…
            </div>
          ) : selectedRole ? (
            <RoleDetail
              role={selectedRole}
              groups={groups}
              draft={draftPerms}
              busy={busy}
              onBack={() => setSelectedRole(null)}
              onToggle={(name) =>
                setDraftPerms((prev) => {
                  const next = new Set(prev);
                  if (next.has(name)) next.delete(name);
                  else next.add(name);
                  return next;
                })
              }
              onSave={saveRole}
              onRemoveMember={(userId) => toggleAssignment(userId, selectedRole.id, true)}
            />
          ) : tab === "roles" ? (
            <RolesList roles={roles} onOpen={openRole} onNew={() => setNewOpen(true)} />
          ) : tab === "users" ? (
            <UsersList users={users} roles={roles} onToggle={toggleAssignment} />
          ) : (
            <Matrix roles={roles} groups={groups} onToggle={toggleMatrixCell} />
          )}
        </div>
      </div>

      {newOpen ? (
        <NewRoleModal
          groups={groups}
          onClose={() => setNewOpen(false)}
          onCreate={async (input) => {
            if (!accessToken) return;
            setBusy(true);
            setError(null);
            try {
              const created = await authzApi.createRole(accessToken, input);
              setNewOpen(false);
              await loadAll();
              await openRole(created.id);
              flash("Role created");
            } catch (e) {
              runError(e);
            } finally {
              setBusy(false);
            }
          }}
        />
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-[10px] bg-[#20160f] px-[18px] py-2.5 text-[13px] font-semibold text-[#f4ead4] shadow-xl">
          {toast}
        </div>
      ) : null}
    </AppShell>
  );
}

type Group = { name: string; items: AuthzPermission[] };

function Badge({ role }: { role: { is_system: boolean; is_locked: boolean } }) {
  if (role.is_system) {
    return (
      <span className="rounded-full bg-[#e7f0e2] px-2 py-[3px] text-[11px] font-semibold text-[#2c5a38]">
        System
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#efe7d6] px-2 py-[3px] text-[11px] font-semibold text-[#7a634a]">
      Custom
    </span>
  );
}

function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-[10px] border border-[#eadfcb] bg-white p-[22px]">{children}</div>;
}

function RolesList({
  roles,
  onOpen,
  onNew,
}: {
  roles: AuthzRoleSummary[];
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-serif text-[17px] font-semibold">Roles</div>
          <div className="mt-[3px] text-[12.5px] text-[#957a5c]">
            Every permission is granted through a role. System roles can be duplicated but not
            edited.
          </div>
        </div>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-[10px] bg-[#346b41] px-4 py-2.5 text-[13.5px] font-semibold text-[#f4ead4] shadow hover:bg-[#2c5a38]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New role
        </button>
      </div>
      <div className="mt-3.5 flex flex-col">
        {roles.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onOpen(r.id)}
            className="flex items-center gap-3.5 rounded-lg border-t border-[#eadfcb] px-3 py-3.5 text-left hover:bg-[#fcf8f0]"
          >
            <div
              className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] text-[#f4ead4]"
              style={{ background: TILE }}
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 3l8 3.5v5c0 4.4-3.2 8.3-8 9.5-4.8-1.2-8-5.1-8-9.5v-5z" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <span className="text-[14px] font-semibold">{r.display_name || r.name}</span>
                <Badge role={r} />
              </div>
              <div className="mt-[3px] text-[12.5px] text-[#75583f]">{r.description}</div>
            </div>
            <div className="flex-none text-right">
              <div className="font-mono text-[12px] font-medium text-[#20160f]">
                {r.permissions.length} perms
              </div>
              <div className="text-[11px] text-[#957a5c]">
                {r.member_count} {r.member_count === 1 ? "person" : "people"}
              </div>
            </div>
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px] flex-none"
              fill="none"
              stroke="#b49a78"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        ))}
      </div>
    </Card>
  );
}

function RoleDetail({
  role,
  groups,
  draft,
  busy,
  onBack,
  onToggle,
  onSave,
  onRemoveMember,
}: {
  role: AuthzRoleDetail;
  groups: Group[];
  draft: Set<string>;
  busy: boolean;
  onBack: () => void;
  onToggle: (name: string) => void;
  onSave: () => void;
  onRemoveMember: (userId: string) => void;
}) {
  const locked = role.is_locked;
  return (
    <>
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-[9px] border border-[#eadfcb] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#3f2d22] hover:bg-[#f4ead4]"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-[15px] w-[15px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M15 6l-6 6 6 6" />
          </svg>
          All roles
        </button>
        <span className="text-[12.5px] text-[#957a5c]">
          Roles / {role.display_name || role.name}
        </span>
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-serif text-[19px] font-semibold">
                {role.display_name || role.name}
              </span>
              <Badge role={role} />
            </div>
            <div className="mt-1 max-w-[640px] text-[12.5px] text-[#75583f]">
              {role.description}
            </div>
          </div>
          {!locked ? (
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className="rounded-[10px] bg-[#346b41] px-4 py-2 text-[13px] font-semibold text-[#f4ead4] shadow hover:bg-[#2c5a38] disabled:opacity-50"
            >
              {busy ? "Saving…" : "Save role"}
            </button>
          ) : null}
        </div>

        {locked ? (
          <div className="mt-4 rounded-[10px] border border-[#e8d8ae] bg-[#f6ecd4] px-3.5 py-2.5 text-[12.5px] text-[#8a6316]">
            This is a system role. Its permissions are fixed by the edition. Duplicate it to make an
            editable copy.
          </div>
        ) : null}

        <div className="mt-[18px] grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[18px]">
          {groups.map((g) => (
            <div key={g.name} className="rounded-[10px] border border-[#eadfcb] bg-[#fcf8f0] p-3.5">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[1.1px] text-[#75583f]">
                {g.name}
              </div>
              <div className="flex flex-col gap-0.5">
                {g.items.map((p) => {
                  const on = draft.has(p.name);
                  return (
                    <button
                      key={p.name}
                      type="button"
                      disabled={locked}
                      onClick={() => onToggle(p.name)}
                      className={`flex items-start gap-2.5 rounded-lg px-1.5 py-[7px] text-left ${locked ? "cursor-default" : "cursor-pointer hover:bg-[#f4ead4]"}`}
                    >
                      <span
                        className="mt-px flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border-[1.5px]"
                        style={{
                          borderColor: on ? "#346b41" : "#c9b795",
                          background: on ? "#346b41" : "#fff",
                        }}
                      >
                        <Check on={on} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium">
                          {p.description || p.name}
                        </span>
                        <span className="block font-mono text-[10.5px] text-[#a8906d]">
                          {p.name}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="font-serif text-[17px] font-semibold">
          Assigned to {role.member_count} {role.member_count === 1 ? "person" : "people"}
        </div>
        <div className="mt-[3px] mb-2 text-[12.5px] text-[#957a5c]">
          Removing someone here leaves their other roles untouched.
        </div>
        {role.members.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-[#d8c9a9] p-3 text-[12.5px] text-[#957a5c]">
            No one holds this role yet.
          </div>
        ) : (
          role.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 border-t border-[#eadfcb] py-3">
              <div
                className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-[9px] font-serif text-[12.5px] font-bold text-[#f4ead4]"
                style={{ background: TILE }}
              >
                {initials(m.display_name, m.email)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-semibold">{m.display_name || m.email}</div>
                <div className="text-[12px] text-[#957a5c]">{m.email}</div>
              </div>
              <button
                type="button"
                onClick={() => onRemoveMember(m.id)}
                className="rounded-[9px] border border-[#eadfcb] px-2.5 py-1.5 text-[12.5px] font-semibold text-[#b46038] hover:bg-[#f5e2d6]"
              >
                Remove
              </button>
            </div>
          ))
        )}
      </Card>
    </>
  );
}

function UsersList({
  users,
  roles,
  onToggle,
}: {
  users: AuthzUserWithRoles[];
  roles: AuthzRoleSummary[];
  onToggle: (userId: string, roleId: string, has: boolean) => void;
}) {
  const [openFor, setOpenFor] = useState<string | null>(null);
  return (
    <Card>
      <div className="font-serif text-[17px] font-semibold">Users</div>
      <div className="mt-[3px] text-[12.5px] text-[#957a5c]">
        A person can hold several roles. What they can do is the union of every role they hold.
      </div>
      <div className="mt-3 flex flex-col">
        {users.map((u) => {
          const held = new Set(u.roles.map((r) => r.id));
          return (
            <div
              key={u.id}
              className="flex flex-wrap items-center gap-3 border-t border-[#eadfcb] py-3.5"
            >
              <div
                className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[9px] font-serif text-[13.5px] font-bold text-[#f4ead4]"
                style={{ background: TILE }}
              >
                {initials(u.display_name, u.email)}
              </div>
              <div className="min-w-0 flex-[1_1_160px]">
                <div className="text-[13.5px] font-semibold">{u.display_name || u.email}</div>
                <div className="text-[12px] text-[#957a5c]">{u.email}</div>
              </div>
              <div className="flex min-w-0 flex-[1_1_140px] flex-wrap gap-1.5">
                {u.roles.length === 0 ? (
                  <span className="text-[12px] text-[#957a5c]">No roles</span>
                ) : (
                  u.roles.map((r) => (
                    <span
                      key={r.id}
                      className="rounded-full bg-[#efe7d6] px-2.5 py-1 text-[11.5px] font-semibold text-[#7a634a]"
                    >
                      {r.display_name || r.name}
                    </span>
                  ))
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpenFor(openFor === u.id ? null : u.id)}
                className="flex-none rounded-[9px] border border-[#eadfcb] bg-white px-3 py-1.5 text-[12.5px] font-semibold text-[#3f2d22] hover:bg-[#f4ead4]"
              >
                Manage roles
              </button>
              {openFor === u.id ? (
                <div className="w-full">
                  <div className="mt-2 grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-1.5 rounded-[12px] border border-[#eadfcb] bg-[#fcf8f0] p-2.5">
                    {roles.map((r) => {
                      const has = held.has(r.id);
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => onToggle(u.id, r.id, has)}
                          className="flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] text-[#3b2f22] hover:bg-[#f4ead4]"
                        >
                          <span
                            className="flex h-[18px] w-[18px] flex-none items-center justify-center rounded-[5px] border-[1.5px]"
                            style={{
                              borderColor: has ? "#346b41" : "#c9b795",
                              background: has ? "#346b41" : "#fff",
                            }}
                          >
                            <Check on={has} />
                          </span>
                          <span className="min-w-0 flex-1 truncate">
                            {r.display_name || r.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function Matrix({
  roles,
  groups,
  onToggle,
}: {
  roles: AuthzRoleSummary[];
  groups: Group[];
  onToggle: (role: AuthzRoleSummary, permName: string, has: boolean) => void;
}) {
  const cols = `minmax(280px,1fr) repeat(${roles.length},76px)`;
  return (
    <Card>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-serif text-[17px] font-semibold">Permissions</div>
          <div className="mt-[3px] text-[12.5px] text-[#957a5c]">
            The full permission set, and which roles hold each one. Click a cell to grant or revoke
            (system roles are locked).
          </div>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <div style={{ minWidth: 320 + roles.length * 76 }}>
          <div
            className="sticky top-0 grid items-end border-b border-[#eadfcb] bg-white pb-2.5"
            style={{ gridTemplateColumns: cols }}
          >
            <div className="text-[10px] font-bold uppercase tracking-[1.1px] text-[#957a5c]">
              Permission
            </div>
            {roles.map((r) => (
              <div
                key={r.id}
                className="px-1 text-center text-[11.5px] font-semibold leading-tight text-[#3f2d22]"
              >
                {r.display_name || r.name}
              </div>
            ))}
          </div>
          {groups.map((g) => (
            <div key={g.name}>
              <div className="pt-3 pb-1.5 text-[11px] font-bold uppercase tracking-[1.1px] text-[#75583f]">
                {g.name}
              </div>
              {g.items.map((p) => (
                <div
                  key={p.name}
                  className="grid items-center border-t border-[#f0e7d6] py-2"
                  style={{ gridTemplateColumns: cols }}
                >
                  <div className="min-w-0 pr-3.5">
                    <div className="text-[13px] font-medium">{p.description || p.name}</div>
                    <div className="font-mono text-[10.5px] text-[#a8906d]">{p.name}</div>
                  </div>
                  {roles.map((r) => {
                    const has = r.permissions.includes(p.name);
                    return (
                      <div key={r.id} className="flex justify-center">
                        <button
                          type="button"
                          disabled={r.is_locked}
                          onClick={() => onToggle(r, p.name, has)}
                          title={
                            r.is_locked ? "System role — locked" : has ? "Granted" : "Not granted"
                          }
                          className={`flex h-5 w-5 items-center justify-center rounded-[6px] border-[1.5px] ${r.is_locked ? "cursor-default" : "cursor-pointer"}`}
                          style={{
                            borderColor: has ? "#346b41" : "#d8c9a9",
                            background: has ? "#346b41" : r.is_locked ? "#efe7d6" : "#fff",
                          }}
                        >
                          <Check on={has} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function NewRoleModal({
  groups,
  onClose,
  onCreate,
}: {
  groups: Group[];
  onClose: () => void;
  onCreate: (input: {
    name: string;
    display_name?: string;
    description?: string;
    permissions: string[];
  }) => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const slug = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return (
    <div>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fixed inset-0 z-[52] bg-[#20160f]/40"
      />
      <div className="fixed left-1/2 top-1/2 z-[53] max-h-[88vh] w-[560px] max-w-[94vw] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[14px] border border-[#eadfcb] bg-[#fcf8f0] p-[22px] shadow-2xl">
        <div className="font-serif text-[19px] font-semibold">New role</div>
        <div className="mb-4 mt-1 text-[12.5px] text-[#957a5c]">
          Roles are local to this instance. A machine name is derived from the label.
        </div>

        <label
          htmlFor="new-role-name"
          className="mb-1 block text-[12px] font-semibold text-[#3f2d22]"
        >
          Role name
        </label>
        <input
          id="new-role-name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="e.g. Irrigation lead"
          className="mb-1 w-full rounded-[10px] border-[1.5px] border-[#eadfcb] bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-[#346b41]"
        />
        {slug ? (
          <div className="mb-3 font-mono text-[11px] text-[#a8906d]">{slug}</div>
        ) : (
          <div className="mb-3" />
        )}

        <label
          htmlFor="new-role-desc"
          className="mb-1 block text-[12px] font-semibold text-[#3f2d22]"
        >
          Description
        </label>
        <textarea
          id="new-role-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What this role is for"
          className="mb-4 w-full resize-y rounded-[10px] border-[1.5px] border-[#eadfcb] bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-[#346b41]"
        />

        <div className="mb-2 text-[11px] font-bold uppercase tracking-[1.1px] text-[#75583f]">
          Permissions
        </div>
        <div className="flex flex-col gap-1.5">
          {groups.map((g) => (
            <div key={g.name} className="rounded-[10px] border border-[#eadfcb] bg-white p-3">
              <div className="mb-1.5 text-[12px] font-semibold text-[#3f2d22]">{g.name}</div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-1">
                {g.items.map((p) => {
                  const on = selected.has(p.name);
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() =>
                        setSelected((prev) => {
                          const n = new Set(prev);
                          if (n.has(p.name)) n.delete(p.name);
                          else n.add(p.name);
                          return n;
                        })
                      }
                      className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-left text-[12.5px] hover:bg-[#f4ead4]"
                    >
                      <span
                        className="flex h-[16px] w-[16px] flex-none items-center justify-center rounded-[4px] border-[1.5px]"
                        style={{
                          borderColor: on ? "#346b41" : "#c9b795",
                          background: on ? "#346b41" : "#fff",
                        }}
                      >
                        <Check on={on} />
                      </span>
                      <span className="min-w-0 truncate">{p.description || p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[18px] flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[10px] border border-[#eadfcb] bg-white px-4 py-2.5 text-[13px] font-semibold text-[#3f2d22]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!slug}
            onClick={() =>
              onCreate({
                name: slug,
                display_name: displayName.trim() || undefined,
                description: description.trim() || undefined,
                permissions: [...selected],
              })
            }
            className="rounded-[10px] bg-[#346b41] px-4 py-2.5 text-[13px] font-semibold text-[#f4ead4] disabled:opacity-50"
          >
            Create role
          </button>
        </div>
      </div>
    </div>
  );
}
