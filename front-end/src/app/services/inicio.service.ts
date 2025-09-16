import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class InicioService {
  private url:string;

  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }

  inicio(usuario: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    return this.http.post<any>(environment.apiUrl+"login", usuario, httpOptions);
  }

 
}