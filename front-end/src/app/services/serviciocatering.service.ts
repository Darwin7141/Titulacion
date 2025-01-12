import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';


@Injectable({
  providedIn: 'root'
})
export class ServiciocateringService {

  private url:string;
  
  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }

  getServicio(): Observable<any[]> {
    return this.http.get<any[]>(this.url +"servicio")
    
    }


  agregar(servicio: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    return this.http.post<any>(this.url +"servicio", servicio, httpOptions);
  }

  editarServicio(servicio: any): Observable<any> {
    return this.http.put<any>(
      `${this.url}servicio/${servicio.idservicio}`,
      servicio,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }
    );
  }
  
  eliminarServicio(idservicio: string): Observable<any> {
    return this.http.delete<any>(`${this.url}servicio/${idservicio}`);
  }
  
}
