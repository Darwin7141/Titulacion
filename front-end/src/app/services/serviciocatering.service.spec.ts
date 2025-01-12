import { TestBed } from '@angular/core/testing';

import { ServiciocateringService } from './serviciocatering.service';

describe('ServiciocateringService', () => {
  let service: ServiciocateringService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiciocateringService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
