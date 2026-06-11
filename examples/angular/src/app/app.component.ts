import { Component, NgZone, OnInit } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import * as jam from "@jam.dev/recording-links/sdk";

@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  template: `
    <h1>
      Welcome to <span data-jam-blur>{{ title }}!</span>
    </h1>
    <p>
      This app installs Recording Links with the
      <code>&#64;jam.dev/recording-links</code> npm package, initialized once
      from the root component. Open it through a Recording Link to start a
      capture, then use the buttons below to generate activity you can check
      for in the resulting jam.
    </p>
    <button type="button" (click)="logToConsole()">Log to console</button>
    <button type="button" (click)="throwError()">Throw an error</button>
    <button type="button" (click)="makeRequest()">
      Make a network request
    </button>
    <p>{{ status }}</p>

    <router-outlet />
  `,
  styles: [],
})
export class AppComponent implements OnInit {
  title = "angular";
  status = "";

  constructor(private ngZone: NgZone) {}

  ngOnInit() {
    this.ngZone.runOutsideAngular(() => {
      jam.initialize({ teamId: "JAM_TEAM_ID" });
    });
  }

  logToConsole() {
    console.log("Hello from the Angular example", {
      at: new Date().toISOString(),
    });
    this.status = "Logged to console — check the jam's console tab.";
  }

  throwError() {
    this.status = "Threw an error — check the jam's console tab.";
    throw new Error("Intentional error from the Angular example");
  }

  async makeRequest() {
    const response = await fetch(
      "https://jsonplaceholder.typicode.com/todos/1",
    );
    const todo = await response.json();
    this.ngZone.run(() => {
      this.status = `Fetched todo "${todo.title}" — check the jam's network tab.`;
    });
  }
}
