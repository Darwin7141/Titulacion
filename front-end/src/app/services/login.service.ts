import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';
import { tap } from 'rxjs/operators';  
import { environment } from '../../environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  private url:string;

  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }

  login(credentials: any): Observable<any> {
  const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
    withCredentials: true
  };

  return this.http.post<any>(environment.apiUrl + 'login', credentials, httpOptions).pipe(
    tap((resp) => {
      /* 1. Vaciar lo anterior */
      localStorage.removeItem('identity_user');

      /* 2. Guardar TODO el objeto que te devuelva el back-end */
      localStorage.setItem('identity_user', JSON.stringify(resp.usuario));
    })
  );
}
}