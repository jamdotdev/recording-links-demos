import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("");

  return (
    <main>
      <h1>Jam Recording Links — Next.js Pages Router example</h1>
      <p>
        This app installs Recording Links via <code>next/script</code> in{" "}
        <code>pages/_document.tsx</code>. Open it through a Recording Link to
        start a capture, then use the buttons below to generate activity you
        can check for in the resulting jam.
      </p>
      <button
        type="button"
        onClick={() => {
          console.log("Hello from the Pages Router example", {
            at: new Date().toISOString(),
          });
          setStatus("Logged to console — check the jam's console tab.");
        }}
      >
        Log to console
      </button>
      <button
        type="button"
        onClick={() => {
          setStatus("Threw an error — check the jam's console tab.");
          throw new Error("Intentional error from the Pages Router example");
        }}
      >
        Throw an error
      </button>
      <button
        type="button"
        onClick={async () => {
          const response = await fetch(
            "https://jsonplaceholder.typicode.com/todos/1",
          );
          const todo = await response.json();
          setStatus(
            `Fetched todo "${todo.title}" — check the jam's network tab.`,
          );
        }}
      >
        Make a network request
      </button>
      <p>{status}</p>
    </main>
  );
}
