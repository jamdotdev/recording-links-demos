const status = document.querySelector("#status");

const report = (message) => {
  status.textContent = message;
};

document.querySelector("#log").addEventListener("click", () => {
  console.log("Hello from the GTM example", { at: new Date().toISOString() });
  report("Logged to console — check the jam's console tab.");
});

document.querySelector("#error").addEventListener("click", () => {
  report("Threw an error — check the jam's console tab.");
  throw new Error("Intentional error from the GTM example");
});

document.querySelector("#fetch").addEventListener("click", async () => {
  const response = await fetch("https://jsonplaceholder.typicode.com/todos/1");
  const todo = await response.json();
  report(`Fetched todo "${todo.title}" — check the jam's network tab.`);
});
