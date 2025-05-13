import * as fs from "node:fs";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const filePath = "count.txt";

async function readCount() {
  return parseInt(
    await fs.promises.readFile(filePath, "utf-8").catch(() => "0")
  );
}

const getCount = createServerFn({
  method: "GET",
}).handler(() => {
  return readCount();
});

const updateCount = createServerFn({ method: "POST" })
  .validator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount();
    await fs.promises.writeFile(filePath, `${count + data}`);
  });

// n.b. we can't create a `DELETE` server fn
const resetCount = createServerFn({ method: "POST" }).handler(async () => {
  await fs.promises.writeFile(filePath, "0");
});

export const Route = createFileRoute("/")({
  component: Home,
  loader: async () => await getCount(),
});

function Home() {
  const router = useRouter();
  const state = Route.useLoaderData();
  console.log("render w/ count:", state);

  return (
    <ul>
      <li>
        <button
          type="button"
          onClick={() => {
            updateCount({ data: 1 }).then(() => {
              router.invalidate();
            });
          }}
        >
          Add 1 to {state}?
        </button>
      </li>
      <li>
        <button
          type="button"
          onClick={() => {
            resetCount().then(() => {
              router.invalidate();
            });
          }}
        >
          Reset
        </button>
      </li>
      <li>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget as HTMLFormElement;
            const formData = new FormData(form);
            const recordingId = formData.get("recording-id") as string;

            const url = new URL(window.location.href);
            url.searchParams.delete("jam-recording");
            url.searchParams.set("jam-recording", recordingId);

            window.history.replaceState({}, "", url.toString());
            window.location.reload();
          }}
        >
          <label>
            Recording ID:
            <input
              name="recording-id"
              type="text"
              placeholder="Create me at Jam.dev"
            />
          </label>
          <button type="submit">Open</button>
        </form>
      </li>
    </ul>
  );
}
