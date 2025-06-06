import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment'; // o donde definas la URL

export interface NotifData {
  idreserva: string;
  codigocliente: string;
  mensaje: string;
  timestamp: string;
  clienteNombre?: string;
  nuevoEstado?: string;    // para evento de cambio de estado
  tipoPago?: string;       // para evento de pago
  montoPago?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private socket: Socket;
  private readonly WS_URL = environment.wsUrl // tu backend con WS

  // Subjects para emitir internamente los datos recibidos
  private nuevaReservaSubject = new BehaviorSubject<NotifData | null>(null);
  private nuevoPagoSubject = new BehaviorSubject<NotifData | null>(null);
  private nuevoPagoFinalSubject = new BehaviorSubject<NotifData | null>(null);
  private cambioEstadoSubject = new BehaviorSubject<NotifData | null>(null);

  constructor() {
    console.log('[NotificacionesService] Conectando a WebSocket en:', this.WS_URL);
    this.socket = io(this.WS_URL);

    // Apenas se conecte, confirmá en consola:
    this.socket.on('connect', () => {
      console.log('[NotificacionesService] Socket.IO conectado con ID:', this.socket.id);
    });

    this.socket.on('disconnect', () => {
      console.log('[NotificacionesService] Socket.IO desconectado');
    });
  

    // 1) Si el usuario es cliente, debe identificarse:
    const user = JSON.parse(localStorage.getItem('identity_user') || '{}');
    const codigocliente = user?.codigocliente;
    if (codigocliente) {
      this.socket.emit('identificar-cliente', codigocliente);
    }

    // 2) Si este usuario es admin (por ejemplo user.rol === 1), lo identificamos:
    if (user?.rol === 1) {
      this.socket.emit('identificar-admin');
    }

    // 3) Configuramos listeners a los distintos eventos que el servidor emite:
    this.socket.on('nueva-reserva', (data: NotifData) => {
      this.nuevaReservaSubject.next(data);
    });
    this.socket.on('nuevo-pago', (data: NotifData) => {
      this.nuevoPagoSubject.next(data);
    });
    this.socket.on('nuevo-pago-final', (data: NotifData) => {
      this.nuevoPagoFinalSubject.next(data);
    });
    this.socket.on('cambio-estado', (data: NotifData) => {
      this.cambioEstadoSubject.next(data);
    });
  }

  // Observables que exponen los datos a los componentes
  onNuevaReserva(): Observable<NotifData | null> {
    return this.nuevaReservaSubject.asObservable();
  }
  onNuevoPago(): Observable<NotifData | null> {
    return this.nuevoPagoSubject.asObservable();
  }
  onNuevoPagoFinal(): Observable<NotifData | null> {
    return this.nuevoPagoFinalSubject.asObservable();
  }
  onCambioEstado(): Observable<NotifData | null> {
    return this.cambioEstadoSubject.asObservable();
  }

  // Opcional: desconectar WS (cuando se cierre sesión, por ejemplo)
  desconectar() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}