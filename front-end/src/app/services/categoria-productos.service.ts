import { Injectable } from '@angular/core';
import { GLOBAL } from './global';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoriaProductosService {

  private url:string;

  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }
  
  getCategoria(): Observable<any[]> {
    return this.http.get<any[]>(this.url +"categoriaProductos")
    
    }

    agregar(categoria: any): Observable<any> {
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type':  'application/json'
        })
      };
  
      return this.http.post<any>(this.url +"categoriaProductos", categoria, httpOptions);
    }

    editarCategoria(categoria: any): Observable<any> {
      return this.http.put<any>(
        `${this.url}categoriaProductos/${categoria.idcategoria}`,
        categoria,
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        }
      );
    }
    
    eliminarCategoria(idcategoria: string): Observable<any> {
      return this.http.delete<any>(`${this.url}categoriaProductos/${idcategoria}`);
    }

}
