import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListacateringComponent } from './listacatering.component';

describe('ListacateringComponent', () => {
  let component: ListacateringComponent;
  let fixture: ComponentFixture<ListacateringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListacateringComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListacateringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
