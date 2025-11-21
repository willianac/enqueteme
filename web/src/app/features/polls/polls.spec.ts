import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Polls } from './polls';

describe('Polls', () => {
  let component: Polls;
  let fixture: ComponentFixture<Polls>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Polls]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Polls);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
