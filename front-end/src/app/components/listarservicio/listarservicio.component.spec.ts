import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarservicioComponent } from './listarservicio.component';

describe('ListarservicioComponent', () => {
  let component: ListarservicioComponent;
  let fixture: ComponentFixture<ListarservicioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListarservicioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarservicioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
