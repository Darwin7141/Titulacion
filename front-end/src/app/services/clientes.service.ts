import { Injectable } from '@angular/core';
import { GLOBAL } from './global';
import { HttpClient} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private url:string;

  constructor(private _http: HttpClient) { 
    this.url=GLOBAL.url;
  }
  
  getClientes(): Observable<any[]> {
    return this._http.get<any[]>(this.url +"cliente")
    
    }
}



