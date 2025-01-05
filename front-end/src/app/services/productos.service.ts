import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  private url:string;
  
  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }

  getProducto(): Observable<any[]> {
    return this.http.get<any[]>(this.url +"productos")
    
    }

  agregar(prod: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    return this.http.post<any>(this.url +"productos", prod, httpOptions);
  }

  editarProducto(prod: any): Observable<any> {
    return this.http.put<any>(
      `${this.url}productos/${prod.idproducto}`,
      prod,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }
    );
  }
  
  eliminarProducto(idproducto: string): Observable<any> {
    return this.http.delete<any>(`${this.url}productos/${idproducto}`);
  }
  
}