import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root'
})
export class EstadoReservaService {

  private url:string;
  
  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }

  getEstadoReserva(): Observable<any[]> {
    return this.http.get<any[]>(this.url +"estadoReserva")
    
    }


  agregar(servicio: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    return this.http.post<any>(this.url +"estadoReserva", servicio, httpOptions);
  }

  editarEstadoReserva(res: any): Observable<any> {
    return this.http.put<any>(
      `${this.url}estadoReserva/${res.idestado}`,
      res,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }
    );
  }
  
  
  
 
}  