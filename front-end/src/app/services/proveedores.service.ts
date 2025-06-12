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

  constructor(private http: HttpClient) {}
}
