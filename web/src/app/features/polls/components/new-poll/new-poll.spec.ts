import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewPoll } from './new-poll';

describe('NewPoll', () => {
  let component: NewPoll;
  let fixture: ComponentFixture<NewPoll>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewPoll]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewPoll);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
