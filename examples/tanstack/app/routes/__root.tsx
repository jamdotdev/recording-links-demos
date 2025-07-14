import React, { type ReactNode } from "react";
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
  React.useEffect(() => {
    let counter = 0;
    const intervalId = setInterval(
      () => console.log("im a log", counter++),
      Math.random() * 5000 + 15000 // every 15-20 seconds
    );

    return () => clearInterval(intervalId);
  }, []);
  return (
    <html>
      <head>
        <script type="module" src="https://js.jam.test:8888/capture.js" />
        <script type="module" src="https://js.jam.test:8888/recorder.js" />

        <HeadContent />
        <meta name="jam:team" content="f5f89d61-4a4c-4d85-afe1-e5acafd558b5" />
        <meta name="jam:team" content="87cdf305-4dfc-4070-a2a8-fd3a7b582097" />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
