import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root'
})
export class AdministradorService {

  private url:string;
  
  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }

  getAdministrador(): Observable<any[]> {
    return this.http.get<any[]>(this.url +"administrador")
    
    }

  agregar(admin: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    return this.http.post<any>(this.url +"administrador", admin, httpOptions);
  }

  editarAdmin(admin: any): Observable<any> {
    return this.http.put<any>(
      `${this.url}administrador/${admin.codigoadmin}`,
      admin,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }
    );
  }
  
  eliminarAdministrador(codigoadmin: string): Observable<any> {
    return this.http.delete<any>(`${this.url}administrador/${codigoadmin}`);
  }
  
}