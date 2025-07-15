import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root'
})
export class EmpleadosService {
  private url = GLOBAL.url;

  // Opciones HTTP reutilizables con headers + envío de credenciales (cookies)
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true    // ← clave para que Express-Session reciba la cookie
  };

  constructor(private http: HttpClient) {}

  // Obtener cargos (si fuera necesario en otro endpoint)
  getCargosEmpleados(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.url}empleados`,
      this.httpOptions
    );
  }

  // Obtener todos los empleados
  getEmpleados(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.url}gestionempleados`,
      this.httpOptions
    );
  }

  // Crear un nuevo empleado
  agregar(empleado: any): Observable<any> {
    return this.http.post<any>(
      `${this.url}gestionempleados`,
      empleado,
      this.httpOptions
    );
  }

  // Editar un empleado existente
  editarEmpleado(empleado: any): Observable<any> {
    return this.http.put<any>(
      `${this.url}gestionempleados/${empleado.codigoempleado}`,
      empleado,
      this.httpOptions
    );
  }

  // Eliminar un empleado
  eliminarEmpleado(codigoempleado: string): Observable<any> {
    return this.http.delete<any>(
      `${this.url}gestionempleados/${codigoempleado}`,
      this.httpOptions
    );
  }

  verificarCedula(ci: string): Observable<any> {
      return this.http.get(`${this.url}empleado/verificarCedula/${ci}`);
    }
    
    verificarEmail(email: string): Observable<any> {
      return this.http.get(`${this.url}empleado/verificarEmail/${email}`);
    }
    
    verificarTelefono(telefono: string): Observable<any> {
      return this.http.get(`${this.url}empleado/verificarTelefono/${telefono}`);
    }

    buscarPorCedula(ci: string): Observable<any> {
      return this.http.get<any>(`${this.url}empleado/porcedula/${ci}`);

    }

    buscarPorEmail(email: string): Observable<any> {
      return this.http.get<any>(`${this.url}empleado/poremail/${email}`);

    }

    buscarPorTelefono(telefono: string): Observable<any> {
      return this.http.get<any>(`${this.url}empleado/portelefono/${telefono}`);
    }
}
