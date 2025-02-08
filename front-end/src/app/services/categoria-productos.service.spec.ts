import { TestBed } from '@angular/core/testing';

import { CategoriaProductosService } from './categoria-productos.service';

describe('CategoriaProductosService', () => {
  let service: CategoriaProductosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoriaProductosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
