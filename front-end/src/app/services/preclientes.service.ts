import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root'
})
export class PreclientesService {
  private url:string;
  
  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }

  getUsuario(): Observable<any[]> {
    return this.http.get<any[]>(this.url +"usuario")
    
    }

  agregar(usuario: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    return this.http.post<any>(this.url +"precliente", usuario, httpOptions);
  }

  editarUsuario(usuario: any): Observable<any> {
    return this.http.put<any>(
      `${this.url}usuario/${usuario.idcuenta}`,
      usuario,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }
    );
  }
  
  eliminarUsuario(idcuenta: string): Observable<any> {
    return this.http.delete<any>(`${this.url}usuario/${idcuenta}`);
  }
  
  verificarCedula(ci: string): Observable<any> {
    return this.http.get(`${this.url}pre/verificarCedula/${ci}`);
  }
  
  verificarEmail(email: string): Observable<any> {
    return this.http.get(`${this.url}pre/verificarEmail/${email}`);
  }
  
  verificarTelefono(telefono: string): Observable<any> {
    return this.http.get(`${this.url}pre/verificarTelefono/${telefono}`);
  }
}
