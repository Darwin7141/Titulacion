import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';

@Injectable({
  providedIn: 'root'
})
export class ReservasService {
  private url: string;

  constructor(private http: HttpClient) {
    this.url = GLOBAL.url; // La base URL, por ejemplo: http://localhost:8010/api/
  }

  // Crear reserva
  createReserva(data: any): Observable<any> {
    // data debe ser un objeto con campos: fechaevento, codigocliente, idservicio, direccionevento, idmenu, precio, cantpersonas, total
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    return this.http.post<any>(`${this.url}reservas`, data, httpOptions);
  }

  // Obtener reservas de un cliente
  getReservasByCliente(codigocliente: string): Observable<any> {
    return this.http.get<any>(`${this.url}reserva/cliente/${codigocliente}`);
  }

  // (Opcional) Listar todas las reservas
  getAllReservas(): Observable<any> {
    return this.http.get<any>(`${this.url}reservas`);
  }

  crearClienteYReserva(data: any): Observable<any> {
    // data incluirá info de “cliente” + “reserva” + “detalle[]”
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    // Supongamos que en tu backend la ruta es /api/reservas/clienteYReserva
    return this.http.post<any>(
      this.url + 'reserva/clienteYReserva',
      data,
      httpOptions
    );
  }

  editarReserva(idreserva: string, data: any): Observable<any> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    return this.http.put<any>(`${this.url}reservas/${idreserva}`, data, httpOptions);
  }

  editarTotal(reserva: any): Observable<any> {
    return this.http.put<any>(
      `${this.url}reservas/${reserva.idreserva}`,
      reserva,
      {
        headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
      }
    );
  }

  // 4) Eliminar reserva (DELETE /api/reservas/:idreserva)
  deleteReserva(idreserva: string): Observable<any> {
    return this.http.delete<any>(`${this.url}reservas/${idreserva}`);
  }

  getReservaById(idreserva: string): Observable<any> {
    return this.http.get<any>(`${this.url}reservas/${idreserva}`);
  }

  procesarPrimerPago(idreserva: string, montoPago: number): Observable<any> {
    return this.http.post<any>(`${this.url}reservas/${idreserva}/pago/primerPago`, { montoPago });
  }

  procesarSegundoPago(idreserva: string, montoPago: number, ): Observable<any> {
    return this.http.post<any>(`${this.url}reservas/${idreserva}/pago/segundoPago`, { montoPago });
  }

  // Método para procesar el pago con tarjeta
  procesarPagoConTarjeta(idreserva: string, saldopendiente: number, montoPago: number, numeroTarjeta: string, fechaExpiracion: string, cvc: string, titular: string): Observable<any> {
    return this.http.post<any>(`${this.url}reservas/${idreserva}/pago/tarjeta`, {
      montoPago, saldopendiente, // Agregar el montoPago aquí
      detallesTarjeta: { numeroTarjeta, fechaExpiracion, cvc, titular } // Correctamente configurado
    });
  }
  
}

