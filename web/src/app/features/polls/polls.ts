import { Component, inject } from '@angular/core';
import { Navbar } from "../../shared/components/navbar/navbar";
import { Poll } from "./components/poll/poll";
import { PollApi } from './services/poll-api';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-polls',
  imports: [Navbar, Poll, CommonModule],
  templateUrl: './polls.html',
  styleUrl: './polls.less',
})
export class Polls {
  pollApi = inject(PollApi);

  polls$ = this.pollApi.getAllPolls();
}
