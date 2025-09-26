import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ValidacionesService {
  constructor(private http: HttpClient) {}

  validarCedulaEcuador(cedula: string): boolean {
    if (cedula.length !== 10) {
      return false;
    }

    const digito_region = parseInt(cedula.substring(0, 2), 10);
    if (digito_region < 1 || digito_region > 24) {
      return false;
    }

    const ultimo_digito = parseInt(cedula.substring(9, 10));
    const pares = [1, 3, 5, 7].reduce((acc, cur) => acc + parseInt(cedula.substring(cur, cur + 1)), 0);
    const impares = [0, 2, 4, 6, 8].reduce((acc, cur) => {
      let num = parseInt(cedula.substring(cur, cur + 1)) * 2;
      if (num > 9) num -= 9;
      return acc + num;
    }, 0);

    const suma_total = pares + impares;
    const primer_digito_suma = parseInt(String(suma_total).substring(0, 1));
    const decena = (primer_digito_suma + 1) * 10;
    const digito_validador = decena - suma_total;

    return digito_validador === ultimo_digito || (digito_validador === 10 && ultimo_digito === 0);
  }

  validarRucEcuador(ruc: string): boolean {
  if (!/^\d{13}$/.test(ruc)) return false;

  const region = parseInt(ruc.slice(0, 2), 10);
  if (region < 1 || region > 24) return false;

  const tercero = parseInt(ruc[2], 10);

  // Naturales 0–5: cédula válida + final "001"
  if (tercero >= 0 && tercero <= 5) {
    if (!this.validarCedulaEcuador(ruc.slice(0, 10))) return false;
    return ruc.slice(10) === '001';
  }

  // Público 6: DV en pos 9 + final "0001"
  if (tercero === 6) {
    const coef = [3,2,7,6,5,4,3,2];
    let suma = 0;
    for (let i = 0; i < 8; i++) suma += parseInt(ruc[i], 10) * coef[i];
    const mod = suma % 11;
    const dv = (mod === 0) ? 0 : 11 - mod;
    if (dv !== parseInt(ruc[8], 10)) return false;
    return ruc.slice(9) === '0001';
  }

  // Privadas/Extranjeras 9: DV en pos 10 + final "001"
  if (tercero === 9) {
    const coef = [4,3,2,7,6,5,4,3,2];
    let suma = 0;
    for (let i = 0; i < 9; i++) suma += parseInt(ruc[i], 10) * coef[i];
    const mod = suma % 11;
    const dv = (mod === 0) ? 0 : 11 - mod;
    if (dv !== parseInt(ruc[9], 10)) return false;
    return ruc.slice(10) === '001';
  }

  return false;
}

  // ➕ NUEVO
  validarIdentificacionEcuador(valor: string): boolean {
    if (!/^\d+$/.test(valor)) return false;
    if (valor.length === 10) return this.validarCedulaEcuador(valor);
    if (valor.length === 13) return this.validarRucEcuador(valor);
    return false;
  }

  validarEmail(email: string): boolean {
  const e = (email ?? '').trim();
  const re = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return re.test(e);
}

  validarTelefono(telefono: string): boolean {
    return /^0\d{9}$/.test(telefono);
  }

  // Métodos para consultar si ya existe en la base de datos
  cedulaExiste(cedula: string): Observable<boolean> {
    return this.http.get<boolean>(`/api/validaciones/cedula/${cedula}`);
  }

  emailExiste(email: string): Observable<boolean> {
    return this.http.get<boolean>(`/api/validaciones/email/${email}`);
  }

  telefonoExiste(telefono: string): Observable<boolean> {
    return this.http.get<boolean>(`/api/validaciones/telefono/${telefono}`);
  }
}
