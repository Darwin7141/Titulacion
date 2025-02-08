import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root'
})
export class ContactoService {
  private url:string;
  // Ajusta la URL base según tu configuración back

  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }
  enviarContacto(formData: any): Observable<any> {
    // Llama a la ruta POST /api/contacto en tu backend
    return this.http.post<any>(`${this.url}contacto`, formData);
  }

}
