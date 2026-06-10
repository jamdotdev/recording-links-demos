import Script from "next/script";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="jam:team" content="JAM_TEAM_ID" />
      </head>
      <body>
        <Script
          src="https://js.jam.dev/recorder.js"
          type="module"
          strategy="beforeInteractive"
        />
        <Script
          src="https://js.jam.dev/capture.js"
          type="module"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
