import { Html, Head, Main, NextScript } from "next/document";
import Script from "next/script";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="jam:team" content="JAM_TEAM_ID" />
      </Head>
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
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
