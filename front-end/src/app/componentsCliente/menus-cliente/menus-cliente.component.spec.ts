import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenusClienteComponent } from './menus-cliente.component';

describe('MenusClienteComponent', () => {
  let component: MenusClienteComponent;
  let fixture: ComponentFixture<MenusClienteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MenusClienteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenusClienteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
