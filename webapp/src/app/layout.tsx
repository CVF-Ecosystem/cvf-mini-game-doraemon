import type { Metadata } from "next";
import { RegisterServiceWorker } from "@/components/pwa/RegisterServiceWorker";
import { Baloo_2, Nunito } from "next/font/google";
import "./globals.css";

const baloo = Baloo_2({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const nunito = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CVF Mini Game Web App",
  description: "Mini game web app for kids, built with CVF plan.",
  manifest: "/manifest.webmanifest",
};

const devServiceWorkerResetScript = `(() => {
  if (!("serviceWorker" in navigator)) return;
  const flag = "cvf-dev-sw-reset";
  navigator.serviceWorker
    .getRegistrations()
    .then(async (registrations) => {
      if (!registrations.length) return;
      await Promise.all(registrations.map((registration) => registration.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
      if (!sessionStorage.getItem(flag)) {
        sessionStorage.setItem(flag, "1");
        window.location.reload();
      } else {
        sessionStorage.removeItem(flag);
      }
    })
    .catch(() => {
      // Best effort cleanup for development.
    });
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV !== "production" ? (
          <script dangerouslySetInnerHTML={{ __html: devServiceWorkerResetScript }} />
        ) : null}
      </head>
      <body className={`${baloo.variable} ${nunito.variable} antialiased`}>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
