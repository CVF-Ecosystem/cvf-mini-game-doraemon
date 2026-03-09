"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const isProduction = process.env.NODE_ENV === "production";
    if (!isProduction) {
      const cleanupDevWorker = async () => {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map((registration) => registration.unregister()));
          if ("caches" in window) {
            const keys = await window.caches.keys();
            await Promise.all(keys.map((key) => window.caches.delete(key)));
          }
        } catch {
          // Ignore cleanup errors in development.
        }
      };
      void cleanupDevWorker();
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Do not block gameplay if service worker registration fails.
      }
    };

    void register();
  }, []);

  return null;
}
