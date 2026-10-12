"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "@/app/actions/wishlist";
import { createSavedFindsStore } from "@/lib/saved-finds-store";
import { readSavedIds } from "./catalog-filters";

const STORAGE_KEY = "measurejoy-saved";
const CHANGE_EVENT = "measurejoy-saved-change";

export function useSavedFinds() {
  const { isLoaded, userId } = useAuth();
  const source = isLoaded ? (userId ? `account:${userId}` : "guest") : null;
  const store = useMemo(
    () =>
      createSavedFindsStore(source, {
        read: async () =>
          source === "guest"
            ? readSavedIds(
                JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"),
              )
            : await getWishlist(),
        write: async (id, added, ids) => {
          if (!source) return false;
          if (source === "guest") {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
          } else {
            const saved = added
              ? await addToWishlist(id)
              : await removeFromWishlist(id);
            if (!saved) return false;
          }
          window.dispatchEvent(
            new CustomEvent(CHANGE_EVENT, { detail: { source } }),
          );
          return true;
        },
      }),
    [source],
  );
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  useEffect(() => {
    if (!source) return;
    void store.load();
    function onStorage(event: StorageEvent) {
      if (
        source === "guest" &&
        (event.key === STORAGE_KEY || event.key === null)
      )
        void store.load();
    }
    function onChange(event: Event) {
      if ((event as CustomEvent<{ source: string }>).detail?.source === source)
        void store.load();
    }
    window.addEventListener("storage", onStorage);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CHANGE_EVENT, onChange);
    };
  }, [source, store]);

  return {
    savedIds: state.ids,
    ready: state.ready,
    loading: state.loading,
    pendingIds: state.pendingIds,
    error: state.error,
    source,
    toggle: store.toggle,
    refresh: store.load,
    clearError: store.clearError,
  };
}
