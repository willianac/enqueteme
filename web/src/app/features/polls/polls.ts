import { Component, inject } from '@angular/core';
import { Navbar } from "../../shared/components/navbar/navbar";
import { Poll } from "./components/poll/poll";
import { PollApi } from './services/poll-api';

@Component({
  selector: 'app-polls',
  imports: [Navbar, Poll],
  templateUrl: './polls.html',
  styleUrl: './polls.less',
})
export class Polls {
  pollApi = inject(PollApi);
  polls = []

  ngOnInit() {
    this.pollApi.getAllPolls().subscribe(polls => {
      console.log(polls);
    });
  }
}
