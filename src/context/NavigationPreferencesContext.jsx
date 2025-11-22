// encoding: utf-8
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_NAV_ITEMS, cloneNavItems } from "../components/navigation/navConfig.jsx";
import { apiAuthFetch } from "../utils/api.js";
import { useAuth } from "./AuthContext.jsx";

const NavigationPreferencesContext = createContext();

function withVisibility(items) {
  return items.map((item) => ({
    ...item,
    hidden: false,
    children: item.children ? withVisibility(item.children) : undefined,
  }));
}

function applyChildren(baseChildren = [], prefChildren = []) {
  const map = new Map(baseChildren.map((child) => [child.id, child]));
  const result = [];

  if (Array.isArray(prefChildren)) {
    for (const pref of prefChildren) {
      const base = map.get(pref?.id);
      if (!base) continue;
      result.push({ ...base, hidden: Boolean(pref.hidden) });
      map.delete(pref.id);
    }
  }

  for (const leftover of map.values()) {
    result.push(leftover);
  }

  return result;
}

function applyLayout(defaultItems, rawLayout) {
  const defaults = withVisibility(cloneNavItems(defaultItems));
  const map = new Map(defaults.map((item) => [item.id, item]));
  const result = [];
  const layout = Array.isArray(rawLayout) ? rawLayout : [];

  for (const pref of layout) {
    const base = map.get(pref?.id);
    if (!base) continue;
    result.push({
      ...base,
      hidden: Boolean(pref.hidden),
      children: base.children ? applyChildren(base.children, pref.children) : undefined,
    });
    map.delete(pref.id);
  }

  for (const leftover of map.values()) {
    result.push(leftover);
  }

  return result;
}

function serializeLayout(tree = []) {
  return tree.map((item) => ({
    id: item.id,
    hidden: Boolean(item.hidden),
    children: item.children ? serializeLayout(item.children) : [],
  }));
}

export function NavigationPreferencesProvider({ children }) {
  const { user } = useAuth();
  const [navTree, setNavTree] = useState(() => withVisibility(cloneNavItems(DEFAULT_NAV_ITEMS)));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const visibleNav = useMemo(
    () =>
      navTree
        .filter((item) => !item.hidden)
        .map((item) => ({
          ...item,
          children: item.children ? item.children.filter((child) => !child.hidden) : undefined,
        })),
    [navTree]
  );

  const loadPreferences = React.useCallback(async () => {
    if (!user) {
      setNavTree(withVisibility(cloneNavItems(DEFAULT_NAV_ITEMS)));
      return;
    }
    setLoading(true);
    try {
      const res = await apiAuthFetch("/api/user/nav-preferences");
      const data = await res.json().catch(() => ({}));
      const layout = applyLayout(DEFAULT_NAV_ITEMS, data?.items);
      setNavTree(layout);
    } catch (err) {
      console.error("Failed to load navigation preferences", err);
      setNavTree(withVisibility(cloneNavItems(DEFAULT_NAV_ITEMS)));
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const savePreferences = React.useCallback(
    async (nextTree) => {
      const payload = serializeLayout(nextTree || navTree);
      setSaving(true);
      try {
        const res = await apiAuthFetch("/api/user/nav-preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: payload }),
        });
        const data = await res.json().catch(() => ({}));
        const layout = applyLayout(DEFAULT_NAV_ITEMS, data?.items || payload);
        setNavTree(layout);
        return { ok: res.ok !== false };
      } catch (err) {
        console.error("Failed to save navigation preferences", err);
        return { ok: false };
      } finally {
        setSaving(false);
      }
    },
    [navTree]
  );

  const resetToDefault = React.useCallback(() => {
    const defaults = withVisibility(cloneNavItems(DEFAULT_NAV_ITEMS));
    setNavTree(defaults);
    return defaults;
  }, []);

  return (
    <NavigationPreferencesContext.Provider
      value={{
        navTree,
        visibleNav,
        loading,
        saving,
        setNavTree,
        savePreferences,
        resetToDefault,
        reload: loadPreferences,
      }}
    >
      {children}
    </NavigationPreferencesContext.Provider>
  );
}

export function useNavigationPreferences() {
  return useContext(NavigationPreferencesContext);
}
