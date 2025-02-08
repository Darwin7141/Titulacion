import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgendarReservaComponent } from './agendar-reserva.component';

describe('AgendarReservaComponent', () => {
  let component: AgendarReservaComponent;
  let fixture: ComponentFixture<AgendarReservaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AgendarReservaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgendarReservaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
