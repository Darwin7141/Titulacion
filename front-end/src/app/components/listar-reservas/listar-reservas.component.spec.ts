import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarReservasComponent } from './listar-reservas.component';

describe('ListarReservasComponent', () => {
  let component: ListarReservasComponent;
  let fixture: ComponentFixture<ListarReservasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListarReservasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarReservasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
