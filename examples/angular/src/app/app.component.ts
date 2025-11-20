import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  template: `
    <h1>
      Welcome to <span data-jam-blur>{{ title }}!</span>
    </h1>

    <router-outlet />
  `,
  styles: [],
})
export class AppComponent {
  title = "angular";
}
