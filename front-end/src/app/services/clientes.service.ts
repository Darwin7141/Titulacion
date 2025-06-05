import { Injectable } from '@angular/core';
import { GLOBAL } from './global';
import { HttpClient, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  private url:string;

  constructor(private http: HttpClient) { 
    this.url=GLOBAL.url;
  }
  
  getClientes(): Observable<any[]> {
    return this.http.get<any[]>(this.url +"cliente")
    
    }

  getClientePorCodigo(codigocliente: string): Observable<any> {
    return this.http.get<any>(`${this.url}cliente/${codigocliente}`);
  }

    agregar(cliente: any): Observable<any> {
      const httpOptions = {
        headers: new HttpHeaders({
          'Content-Type':  'application/json'
        })
      };
  
      return this.http.post<any>(this.url +"cliente", cliente, httpOptions);
    }

    editarCliente(cliente: any): Observable<any> {
      return this.http.put<any>(
        `${this.url}cliente/${cliente.codigocliente}`,
        cliente,
        {
          headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
        }
      );
    }
    
    eliminarCliente(codigocliente: string): Observable<any> {
      return this.http.delete<any>(`${this.url}cliente/${codigocliente}`);
    }

    verificarCedula(ci: string): Observable<any> {
      return this.http.get(`${this.url}verificarCedula/${ci}`);
    }
    
    verificarEmail(email: string): Observable<any> {
      return this.http.get(`${this.url}verificarEmail/${email}`);
    }
    
    verificarTelefono(telefono: string): Observable<any> {
      return this.http.get(`${this.url}verificarTelefono/${telefono}`);
    }

    buscarPorCedula(ci: string): Observable<any> {
      return this.http.get<any>(`${this.url}cliente/porcedula/${ci}`);

    }

    buscarPorEmail(email: string): Observable<any> {
      return this.http.get<any>(`${this.url}cliente/poremail/${email}`);

    }

    buscarPorTelefono(telefono: string): Observable<any> {
      return this.http.get<any>(`${this.url}cliente/portelefono/${telefono}`);
    }
  
  }
  

    




