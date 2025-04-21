import type { ReactNode } from "react";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        {process.env.JAM_TEAM_ID ? (
          process.env.JAM_TEAM_ID.split(",").map((id) => (
            <meta name="jam:team" content={id} key={id} />
          ))
        ) : (
          <meta name="jam:team" content="invalid" />
        )}
        <script
          type="importmap"
          dangerouslySetInnerHTML={{
            __html: `
              { "imports": { "@jam/recorder": "https://recorder.jam.dev/js/recorder" } }
            `.trim(),
          }}
        ></script>
        <script
          type="module"
          dangerouslySetInnerHTML={{
            __html: `
              const params = new URLSearchParams(window.location.search);
              const recordingId = params.get("jamRecordingId");

              if (recordingId) {
                const { Recorder } = await import("@jam/recorder");
                Recorder.open(recordingId);
              }
            `
              .trim()
              .replace(/^              /gm, ""),
          }}
        ></script>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
