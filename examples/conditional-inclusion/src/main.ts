import * as jam from "@jam.dev/recording-links/sdk";
import * as dom from "./dom.js";

(function init() {
  // Initialize SDK with default options
  jam.initialize();

  // When a script is loaded...
  jam.addEventListener("loaded", ({ detail: { name } }) => {
    // Update the UI
    dom.setScriptLoaded(name);

    // If this is the recorder script,
    // set up the recording ID form(s)
    if (name === "recorder") {
      for (const form of dom.getRecordingIdForms()) {
        // If form is hidden, show it
        form.classList.remove("hidden");

        // Bind the form's submit handler
        form.addEventListener("submit", (event) => {
          event.preventDefault();

          const formData = new FormData(form);
          const recordingId = formData.get("recordingId") as string;

          if (!jam.Recorder) {
            console.error("UNEXPECTED - Recorder not loaded yet");
          } else if (!recordingId) {
            console.error("No recordingId provided");
          } else {
            // Open the recorder to the recording ID
            jam.Recorder.open(recordingId);
          }
        });
      }
    }
  });

  // Load the Jam Recorder when you click the button
  for (const button of dom.getLoadRecorderButtons()) {
    button.addEventListener("click", async () => {
      await jam.loadRecorder();
    });
  }
})();
