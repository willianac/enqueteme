import { Component } from '@angular/core';
import { Navbar } from "../../shared/components/navbar/navbar";
import { Poll } from "./components/poll/poll";

@Component({
  selector: 'app-polls',
  imports: [Navbar, Poll],
  templateUrl: './polls.html',
  styleUrl: './polls.less',
})
export class Polls {

}
