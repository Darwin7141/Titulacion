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

  validarEmail(email: string): boolean {
    const re = /^[^\s@]+@gmail\.com$/;
    return re.test(email);
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
