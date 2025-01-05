import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {

    private url:string;
  
    constructor(private http: HttpClient) { 
      this.url=GLOBAL.url;
    }

    getCargosEmpleados(): Observable<any[]> {
      return this.http.get<any[]>(this.url +"empleados")
      
      }

    getEmpleados(): Observable<any[]> {
        return this.http.get<any[]>(this.url +"gestionempleados")
        
        }
  
    agregar(empleado: any): Observable<any> {
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type':  'application/json'
        })
      };
  
      return this.http.post<any>(this.url +"gestionempleados", empleado, httpOptions);
    }

    editarEmpleado(empleado: any): Observable<any> {
      return this.http.put<any>(
        `${this.url}gestionempleados/${empleado.codigoempleado}`,
        empleado,
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        }
      );
    }
    
    eliminarEmpleado(codigoempleado: string): Observable<any> {
      return this.http.delete<any>(`${this.url}gestionempleados/${codigoempleado}`);
    }
    
}