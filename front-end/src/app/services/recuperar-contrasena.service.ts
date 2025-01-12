import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root'
})
export class RecuperarContrasenaService {

  private url: string;

  constructor(private http: HttpClient) {
    this.url = GLOBAL.url;
  }

  solicitarRecuperacion(correo: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json'
      })
    };

    return this.http.post<any>(this.url + "recuperar-contrasena", correo, httpOptions);
  }

  restablecerContraseña(datos: any): Observable<any> {
    console.log('Datos enviados al back-end:', datos); // Verifica el contenido
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
      }),
    };
  
    return this.http.post<any>(this.url + "restablecer-contrasena", datos, httpOptions);
    
  }
}