import { TestBed } from '@angular/core/testing';

import { SeleccionMenusService } from './seleccion-menus.service';

describe('SeleccionMenusService', () => {
  let service: SeleccionMenusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeleccionMenusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
