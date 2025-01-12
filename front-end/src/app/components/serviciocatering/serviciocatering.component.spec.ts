import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiciocateringComponent } from './serviciocatering.component';

describe('ServiciocateringComponent', () => {
  let component: ServiciocateringComponent;
  let fixture: ComponentFixture<ServiciocateringComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ServiciocateringComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ServiciocateringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
