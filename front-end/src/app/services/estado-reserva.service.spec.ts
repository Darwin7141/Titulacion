import { TestBed } from '@angular/core/testing';

import { EstadoReservaService } from './estado-reserva.service';

describe('EstadoReservaService', () => {
  let service: EstadoReservaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstadoReservaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
