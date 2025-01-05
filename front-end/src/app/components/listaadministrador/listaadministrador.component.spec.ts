import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaadministradorComponent } from './listaadministrador.component';

describe('ListaadministradorComponent', () => {
  let component: ListaadministradorComponent;
  let fixture: ComponentFixture<ListaadministradorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListaadministradorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaadministradorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
