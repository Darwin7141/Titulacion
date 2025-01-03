import { Component, OnInit } from '@angular/core';
import { ClientesService } from '../../services/clientes.service';


@Component({
  selector: 'app-home',
  standalone: false,
  
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  clientes: any[] = [];

  constructor(
    
    private clientesService: ClientesService) {}

  ngOnInit(): void {
    this.clientesService.getClientes().subscribe({
      next: (data) => {
        console.log('Datos recibidos:', data); // Verifica si el array llega correctamente
        this.clientes = data; // Asigna los datos recibidos
      },
      error: (err) => {
        console.error('Error al obtener clientes:', err);
      }
    });
  }
}