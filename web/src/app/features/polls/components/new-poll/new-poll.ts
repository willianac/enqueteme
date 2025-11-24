import { Component } from '@angular/core';
import { Navbar } from "../../../../shared/components/navbar/navbar";
import { TuiCardLarge } from '@taiga-ui/layout';
import { TuiPlatform } from '@taiga-ui/cdk';
import { TuiButton, TuiTextfield, TuiAppearance } from '@taiga-ui/core';
import { TuiButtonClose } from '@taiga-ui/kit';

@Component({
  selector: 'app-new-poll',
  imports: [Navbar, TuiCardLarge, TuiPlatform, TuiButton, TuiTextfield, TuiAppearance, TuiButtonClose],
  templateUrl: './new-poll.html',
  styleUrl: './new-poll.less',
})
export class NewPoll {

}
