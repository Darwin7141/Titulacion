import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarproveedorComponent } from './listarproveedor.component';

describe('ListarproveedorComponent', () => {
  let component: ListarproveedorComponent;
  let fixture: ComponentFixture<ListarproveedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListarproveedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarproveedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
