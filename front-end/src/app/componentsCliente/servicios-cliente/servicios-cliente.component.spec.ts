import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiciosClienteComponent } from './servicios-cliente.component';

describe('ServiciosClienteComponent', () => {
  let component: ServiciosClienteComponent;
  let fixture: ComponentFixture<ServiciosClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ServiciosClienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiciosClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
