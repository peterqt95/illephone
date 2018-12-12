import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JudgeWindowComponent } from './judge-window.component';

describe('JudgeWindowComponent', () => {
  let component: JudgeWindowComponent;
  let fixture: ComponentFixture<JudgeWindowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JudgeWindowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JudgeWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
