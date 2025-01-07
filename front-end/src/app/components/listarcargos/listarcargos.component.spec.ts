import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListarcargosComponent } from './listarcargos.component';

describe('ListarcargosComponent', () => {
  let component: ListarcargosComponent;
  let fixture: ComponentFixture<ListarcargosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListarcargosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListarcargosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
