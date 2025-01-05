import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';


@Injectable({
  providedIn: 'root'
})
export class ProveedoresService {

  private url:string;
  
  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }

  getProveedor(): Observable<any[]> {
    return this.http.get<any[]>(this.url +"proveedor")
    
    }

  agregar(prov: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    return this.http.post<any>(this.url +"proveedor", prov, httpOptions);
  }

  editarProveedor(prov: any): Observable<any> {
    return this.http.put<any>(
      `${this.url}proveedor/${prov.codigoproveedor}`,
      prov,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }
    );
  }
  
  eliminarProveedor(codigoproveedor: string): Observable<any> {
    return this.http.delete<any>(`${this.url}proveedor/${codigoproveedor}`);
  }
  
}