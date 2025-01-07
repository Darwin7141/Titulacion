import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root'
})
export class TipocateringService {

  private url:string;
  
  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }

  getEstados(): Observable<any[]> {
    return this.http.get<any[]>(this.url +"estado")
    
    }

  getTipo(): Observable<any[]> {
    return this.http.get<any[]>(this.url +"tipo")
    
    }

  agregar(tipo: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    return this.http.post<any>(this.url +"tipo", tipo, httpOptions);
  }

  editarTipo(tipo: any): Observable<any> {
    return this.http.put<any>(
      `${this.url}tipo/${tipo.idtipo}`,
      tipo,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }
    );
  }
  
  eliminarTipo(idtipo: string): Observable<any> {
    return this.http.delete<any>(`${this.url}tipo/${idtipo}`);
  }
  
}
