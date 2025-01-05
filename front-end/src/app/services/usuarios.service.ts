import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

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

    return this.http.post<any>(this.url +"usuario", usuario, httpOptions);
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
  
}