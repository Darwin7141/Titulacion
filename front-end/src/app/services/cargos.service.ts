import { Injectable } from '@angular/core';
import { GLOBAL } from './global';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class CargosService {
  private url:string;

  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }
  
  getCargos(): Observable<any[]> {
    return this.http.get<any[]>(this.url +"empleados")
    
    }

    agregar(cargo: any): Observable<any> {
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type':  'application/json'
        })
      };
  
      return this.http.post<any>(this.url +"empleados", cargo, httpOptions);
    }

    editarCargo(cargo: any): Observable<any> {
      return this.http.put<any>(
        `${this.url}empleados/${cargo.idcargo}`,
        cargo,
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        }
      );
    }
    
    eliminarCargo(idcargo: string): Observable<any> {
      return this.http.delete<any>(`${this.url}empleados/${idcargo}`);
    }

    

    
}