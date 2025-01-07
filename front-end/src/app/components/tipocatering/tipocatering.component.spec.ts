import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TipocateringComponent } from './tipocatering.component';

describe('TipocateringComponent', () => {
  let component: TipocateringComponent;
  let fixture: ComponentFixture<TipocateringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TipocateringComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TipocateringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
