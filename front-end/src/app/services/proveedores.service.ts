import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({ providedIn: 'root' })
export class ProveedoresService {
  private url = GLOBAL.url;

  // Un httpOptions reutilizable con credenciales
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true    // ← aquí está la clave
  };

  constructor(private http: HttpClient) {}

  getProveedor(): Observable<any[]> {
    // También debes incluir withCredentials en los GET
    return this.http.get<any[]>(`${this.url}proveedor`, this.httpOptions);
  }

  agregar(prov: any): Observable<any> {
    return this.http.post<any>(
      `${this.url}proveedor`,
      prov,
      this.httpOptions       // ← POST con cookie
    );
  }

  editarProveedor(prov: any): Observable<any> {
    return this.http.put<any>(
      `${this.url}proveedor/${prov.codigoproveedor}`,
      prov,
      this.httpOptions
    );
  }

  eliminarProveedor(codigoproveedor: string): Observable<any> {
    return this.http.delete<any>(
      `${this.url}proveedor/${codigoproveedor}`,
      this.httpOptions
    );
  }

  verificarCedula(ci: string): Observable<any> {
      return this.http.get(`${this.url}proveedor/verificarCedula/${ci}`,this.httpOptions);
    }
    
    verificarEmail(email: string): Observable<any> {
      return this.http.get(`${this.url}proveedor/verificarEmail/${email}`,this.httpOptions);
    }
    
    verificarTelefono(telefono: string): Observable<any> {
      return this.http.get(`${this.url}proveedor/verificarTelefono/${telefono}`,this.httpOptions);
    }

    buscarPorCedula(ci: string): Observable<any> {
      return this.http.get<any>(`${this.url}proveedor/porcedula/${ci}`);

    }

    buscarPorEmail(email: string): Observable<any> {
      return this.http.get<any>(`${this.url}proveedor/poremail/${email}`);

    }

    buscarPorTelefono(telefono: string): Observable<any> {
      return this.http.get<any>(`${this.url}proveedor/portelefono/${telefono}`);
    }

  
}
