import * as fs from "node:fs";
import * as path from "node:path";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

const countFilePath = "count.txt";

async function readCount() {
  return parseInt(
    await fs.promises.readFile(countFilePath, "utf-8").catch(() => "0")
  );
}

const getCount = createServerFn({
  method: "GET",
}).handler(() => {
  return readCount();
});

// Used to post a file input to the server
const postFile = createServerFn({
  method: "POST",
})
  .validator((data: FormData) => {
    const file = data.get("file");
    if (!(file instanceof File)) {
      throw new Error("Expected a file input");
    }
    return file;
  })
  .handler(async ({ data }) => {
    const file = data;
    const content = await file.text();
    const filePath = path.join(import.meta.dirname, "..", "..", "tmp", file.name);

    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, content);
  });

const updateCount = createServerFn({ method: "POST" })
  .validator((d: number) => d)
  .handler(async ({ data }) => {
    const count = await readCount();
    await fs.promises.writeFile(countFilePath, `${count + data}`);
  });

// n.b. we can't create a `DELETE` server fn
const resetCount = createServerFn({ method: "POST" }).handler(async () => {
  await fs.promises.writeFile(countFilePath, "0");
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
          onSubmit={async (event) => {
            event.preventDefault();
            await postFile({ data: new FormData(event.currentTarget) });
          }}
        >
          <label>
            Upload a file:
            <input type="file" name="file" />
          </label>
          <button type="submit">Upload</button>
        </form>
      </li>
    </ul>
  );
}
