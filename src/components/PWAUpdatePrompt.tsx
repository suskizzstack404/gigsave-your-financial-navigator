import { useEffect } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { toast } from "sonner";

/**
 * Mounts invisibly in RootComponent.
 * - Registers the service worker and polls for updates every hour.
 * - Shows a Sonner toast when the app is first cached for offline use.
 * - Shows a persistent toast with an "Update now" action when a new SW is waiting.
 */
export function PWAUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, r) {
      // Poll for a new service worker every hour so long-lived tabs still update.
      if (r) {
        setInterval(
          () => {
            r.update();
          },
          60 * 60 * 1000,
        );
      }
    },
    onRegisterError(error) {
      console.error("[PWA] Service worker registration failed:", error);
    },
  });

  // First install — app is now cached for offline use.
  useEffect(() => {
    if (!offlineReady) return;
    toast.success("Ready to work offline", {
      description: "GigSave is installed and works without internet.",
      duration: 5000,
    });
    setOfflineReady(false);
  }, [offlineReady, setOfflineReady]);

  // New SW waiting — prompt the user to update.
  useEffect(() => {
    if (!needRefresh) return;
    const id = toast.info("Update available", {
      description: "A new version of GigSave is ready to install.",
      duration: Infinity,
      action: {
        label: "Update now",
        onClick: () => {
          toast.dismiss(id);
          updateServiceWorker(true);
        },
      },
      cancel: {
        label: "Later",
        onClick: () => setNeedRefresh(false),
      },
      onDismiss: () => setNeedRefresh(false),
    });
    return () => {
      toast.dismiss(id);
    };
  }, [needRefresh, setNeedRefresh, updateServiceWorker]);

  return null;
}
