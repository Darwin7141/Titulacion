import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GLOBAL } from './global';
import { environment } from '../../environments/environment';
import { catchError } from 'rxjs/operators';
import { of, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ReservasService {
  private url: string;

  constructor(private http: HttpClient) {
    this.url = GLOBAL.url; // La base URL, por ejemplo:
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
  getAllReservas() {
  return this.http
    .get<any[]>(this.url + 'reservas')
    .pipe(
      catchError(err => (err.status === 404 ? of([]) : throwError(() => err)))
    );
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
  
  solicitarCancelacion(idreserva: string, codigocliente: string): Observable<any> {
  return this.http.post(
    `${this.url}notificaciones/solicitar-cancelacion`,
    { idreserva, codigocliente }
  );
}

getProductosDeReserva(idreserva: string):
      Observable<{ producto: { idproducto: string, nombre: string }, cantidad: number }[]> {
    return this.http.get< { producto: any, cantidad: number }[] >(
      `${this.url}reservas/${idreserva}/productos`
    );
  }

agregarProductoReserva(
    idreserva: string,
    body: { idproducto: string, cantidad: number }
  ): Observable<{ producto: any, cantidad: number }> {
    const httpOptions = {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    };
    return this.http.post<{ producto: any, cantidad: number }>(
      `${this.url}reservas/${idreserva}/productos`,
      body,
      httpOptions
    );
  }

  restarProductoReserva(idreserva: string, body: { idproducto: string, cantidad: number }): Observable<{ producto: any, cantidad: number }> {
  return this.http.post<any>(
    `${this.url}reservas/${idreserva}/productos/restar`,
    body,
    { headers: new HttpHeaders({ 'Content-Type': 'application/json' }) }
  );
}

/** Elimina por completo un producto de la reserva */
eliminarProductoReserva(idreserva: string, idproducto: string): Observable<void> {
  return this.http.delete<void>(`${this.url}reservas/${idreserva}/productos/${idproducto}`);
}

getReservasUltimosSeisMeses()
  : Observable<{ mes:string, total:number }[]> {
  return this.http.get<any>(this.url + 'dashboard/reservas-6m');
}

getServiciosMasReservados(limit = 5)
  : Observable<{ nombre:string, total:number }[]> {
  return this.http.get<any>(
    `${this.url}dashboard/top-servicios?limit=${limit}`
  );
}
capturarOrdenPayPal(orderId: string) {
  return this.http.post<any>(`${this.url}paypal/capture`, { orderId });
}

countByDate(fecha: string) {
  return this.http.get<{count: number}>(`${this.url}reservas/countByDate/${fecha}`);
}

getFechas() {
  return this.http
    .get<Array<{ idreserva: string; fechaevento: string }>>(
      this.url + 'reservas/fechas'
    )
    .pipe(
      // si la tabla está vacía y el back responde 404, devolvemos []
      catchError(err => (err.status === 404 ? of([]) : throwError(() => err)))
    );
}

}



