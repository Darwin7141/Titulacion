import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagosDialogComponent } from './pagos-dialog.component';

describe('PagosDialogComponent', () => {
  let component: PagosDialogComponent;
  let fixture: ComponentFixture<PagosDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PagosDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagosDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
