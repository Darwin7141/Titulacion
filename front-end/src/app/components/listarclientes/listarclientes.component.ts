import { Component, OnInit } from '@angular/core';
import { ClientesService } from '../../services/clientes.service';
@Component({
  selector: 'app-listarclientes',
  standalone: false,
  
  templateUrl: './listarclientes.component.html',
  styleUrl: './listarclientes.component.css'
})
export class ListarclientesComponent implements OnInit {
  cliente: any[] = [];
  cliFiltrados: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  cliSeleccionado: any = null;

  constructor(private clienteService: ClientesService) {}

  ngOnInit(): void {
   
    this.obtenerClientes();
    this.cargarLista();
  }

  obtenerClientes(): void {
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.cliente = data;
        this.cliFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener clientes', err);
      },
    });
  }

  buscarCliente(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.cliFiltrados = this.cliente; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.cliFiltrados = this.cliente.filter((cliente) =>
        cliente.nombre.toLowerCase().includes(searchTermLower) ||
        cliente.ci.toLowerCase().includes(searchTermLower) // Filtra también por código
      );
    }
  }

  editarClientes(cliente: any): void {
    this.isEditMode = true;
    this.cliSeleccionado = { ...cliente }; // Copia para evitar modificar el original
  }

  guardarEdicion(): void {
    if (this.cliSeleccionado) {
      this.clienteService.editarCliente(this.cliSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.cliSeleccionado = null;
          this.obtenerClientes();
        },
        error: (err) => {
          console.error('Error al actualizar empleado:', err);
        },
      });
    }
  }
  

  eliminarCliente(codigocliente: string): void {
    if (confirm('¿Está seguro de que desea eliminar este cliente?')) {
      this.clienteService.eliminarCliente(codigocliente).subscribe({
        next: () => {
          this.obtenerClientes();
        },
        error: (err) => {
          console.error('Error al eliminar cliente:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.cliSeleccionado = null;
  }
  cargarLista(): void {
    this.clienteService.getClientes().subscribe({
      next: (data) => {
        this.cliente = data;
        this.cliFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener clientes:', err);
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }
}

