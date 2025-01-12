import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';


@Injectable({
  providedIn: 'root'
})
export class MenusService {

  private url:string;
  
  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }

  getMenu(): Observable<any[]> {
    return this.http.get<any[]>(this.url +"menu")
    
    }


  agregar(menu: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    return this.http.post<any>(this.url +"menu", menu, httpOptions);
  }

  editarMenu(menu: any): Observable<any> {
    return this.http.put<any>(
      `${this.url}menu/${menu.idmenu}`,
      menu,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }
    );
  }
  
  eliminarMenu(idmenu: string): Observable<any> {
    return this.http.delete<any>(`${this.url}menu/${idmenu}`);
  }
  
}
