import type * as jam from "@jam.dev/recording-links/sdk";

export function setScriptLoaded(name: jam.ScriptName) {
  const span = document.querySelector<HTMLSpanElement>(
    `li[data-script-block="${name}"] > span`,
  );

  if (span) {
    span.dataset.scriptLoaded = "yes";
    span.innerText = "Yes";
  }
}

export function getLoadRecorderButtons() {
  return document.querySelectorAll<HTMLButtonElement>(
    'button[data-script-loader="recorder"]',
  );
}

export function getRecordingIdForms() {
  return document.querySelectorAll<HTMLFormElement>(
    'form:has(input[name="recordingId"])',
  );
}
