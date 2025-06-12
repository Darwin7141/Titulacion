import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {
  private url = GLOBAL.url;

  // Opciones HTTP reutilizables con headers y credenciales
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true    // ← clave para enviar la cookie de sesión
  };

  constructor(private http: HttpClient) {}

  getProducto(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}productos`, this.httpOptions);
  }

  agregar(prod: any): Observable<any> {
    return this.http.post<any>(
      `${this.url}productos`,
      prod,
      this.httpOptions
    );
  }

  editarProducto(prod: any): Observable<any> {
    return this.http.put<any>(
      `${this.url}productos/${prod.idproducto}`,
      prod,
      this.httpOptions
    );
  }

  eliminarProducto(idproducto: string): Observable<any> {
    return this.http.delete<any>(
      `${this.url}productos/${idproducto}`,
      this.httpOptions
    );
  }

  getProductoByCategoria(idcategoria: number | string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.url}productos/categoria/${idcategoria}`,
      this.httpOptions
    );
  }
}
