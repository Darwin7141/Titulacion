import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarmenusComponent } from './listarmenus.component';

describe('ListarmenusComponent', () => {
  let component: ListarmenusComponent;
  let fixture: ComponentFixture<ListarmenusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListarmenusComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarmenusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
