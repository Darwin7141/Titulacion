import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReestablecerDialogoComponent } from './reestablecer-dialogo.component';

describe('ReestablecerDialogoComponent', () => {
  let component: ReestablecerDialogoComponent;
  let fixture: ComponentFixture<ReestablecerDialogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReestablecerDialogoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReestablecerDialogoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
