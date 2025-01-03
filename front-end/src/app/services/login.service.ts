import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private url:string;

  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }

  login(usuario: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type':  'application/json'
      })
    };

    return this.http.post<any>(this.url +"login", usuario, httpOptions);
  }

 
}