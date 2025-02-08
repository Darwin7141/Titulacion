import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InicioEmpleadoComponent } from './inicio-empleado.component';

describe('InicioEmpleadoComponent', () => {
  let component: InicioEmpleadoComponent;
  let fixture: ComponentFixture<InicioEmpleadoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [InicioEmpleadoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InicioEmpleadoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
