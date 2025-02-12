import { TestBed } from '@angular/core/testing';

import { PreclientesService } from './preclientes.service';

describe('PreclientesService', () => {
  let service: PreclientesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PreclientesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
