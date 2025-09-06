import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificacionPagoComponent } from './notificacion-pago.component';

describe('NotificacionPagoComponent', () => {
  let component: NotificacionPagoComponent;
  let fixture: ComponentFixture<NotificacionPagoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NotificacionPagoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificacionPagoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
