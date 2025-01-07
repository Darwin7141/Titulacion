import { TestBed } from '@angular/core/testing';

import { TipocateringService } from './tipocatering.service';

describe('TipocateringService', () => {
  let service: TipocateringService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TipocateringService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
