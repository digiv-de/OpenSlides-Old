import { Component } from '@angular/core';

import { PollState } from 'app/shared/models/poll/base-poll';
import { BasePollSlideComponent } from 'app/slides/polls/base-poll-slide.component';
import { AssignmentPollSlideData } from './assignment-poll-slide-data';

@Component({
    selector: 'os-assignment-poll-slide',
    templateUrl: './assignment-poll-slide.component.html',
    styleUrls: ['./assignment-poll-slide.component.scss']
})
export class AssignmentPollSlideComponent extends BasePollSlideComponent<AssignmentPollSlideData> {
    public PollState = PollState;

    public options = { maintainAspectRatio: false, responsive: true, legend: { position: 'right' } };
}
