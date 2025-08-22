import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface SeleccionMenu {
  idmenu: string;
  nombre: string;
  servicioName?: string;
  precioUnitario: number;
  cantpersonas: number;
  subtotal: number;
  idservicio?: string;
}

const KEY = 'carritoReserva';

@Injectable({ providedIn: 'root' })
export class SeleccionMenusService {
  private _items$ = new BehaviorSubject<SeleccionMenu[]>(this.load());
  readonly items$ = this._items$.asObservable();

  private load(): SeleccionMenu[] {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
    catch { return []; }
  }
  private persist(items: SeleccionMenu[]) {
    localStorage.setItem(KEY, JSON.stringify(items));
    this._items$.next(items);
  }

  snapshot(): SeleccionMenu[] { return this._items$.getValue(); }

  add(menu: any, qty = 1) {
    const items = this.snapshot().slice();
    const idx = items.findIndex(i => i.idmenu === String(menu.idmenu));
    if (idx >= 0) {
      items[idx].cantpersonas += qty;
      items[idx].subtotal = items[idx].cantpersonas * items[idx].precioUnitario;
    } else {
      items.push({
        idmenu: String(menu.idmenu),
        nombre: menu.nombre,
        servicioName: menu.servicio?.nombre ?? '',
        precioUnitario: Number(menu.precio) || 0,
        cantpersonas: qty,
        subtotal: (Number(menu.precio) || 0) * qty,
        idservicio: String(menu.idservicio ?? menu.servicio?.idservicio ?? '')
      });
    }
    this.persist(items);
  }

  remove(idmenu: string) {
    this.persist(this.snapshot().filter(i => i.idmenu !== idmenu));
  }

  clear() { this.persist([]); }
}
