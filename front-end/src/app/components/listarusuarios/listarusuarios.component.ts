import { Component, OnInit } from '@angular/core';
import { UsuariosService } from '../../services/usuarios.service';


@Component({
  selector: 'app-listarusuarios',
  standalone: false,
  
  templateUrl: './listarusuarios.component.html',
  styleUrl: './listarusuarios.component.css'
})
export class ListarusuariosComponent implements OnInit {
  usuario: any[] = [];
  usuarioFiltrados: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  usuarioSeleccionado: any = null;

  constructor(private usuarioService: UsuariosService) {}

  ngOnInit(): void {
   
    this.obtenerUsuario();
    this.cargarLista();
  }

  obtenerUsuario(): void {
    this.usuarioService.getUsuario().subscribe({
      next: (data) => {
        this.usuario = data;
        this.usuarioFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener usuarios:', err);
      },
    });
  }

  buscarUsuario(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.usuarioFiltrados = this.usuario; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.usuarioFiltrados = this.usuario.filter((usuario) =>
        usuario.correo.toLowerCase().includes(searchTermLower) ||
        usuario.idcuenta.toLowerCase().includes(searchTermLower) // Filtra también por código
      );
    }
  }

  editarUsuario(usuario: any): void {
    this.isEditMode = true;
    this.usuarioSeleccionado = { ...usuario }; // Copia para evitar modificar el original
  }

  guardarEdicion(): void {
    if (this.usuarioSeleccionado) {
      this.usuarioService.editarUsuario(this.usuarioSeleccionado).subscribe({
        next: () => {
          this.isEditMode = false;
          this.usuarioSeleccionado = null;
          this.obtenerUsuario();
        },
        error: (err) => {
          console.error('Error al actualizar usuario:', err);
        },
      });
    }
  }

  eliminarUsuario(idcuenta: string): void {
    if (confirm('¿Está seguro de que desea eliminar este usuario?')) {
      this.usuarioService.eliminarUsuario(idcuenta).subscribe({
        next: () => {
          this.obtenerUsuario();
        },
        error: (err) => {
          console.error('Error al eliminar usuario:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.usuarioSeleccionado = null;
  }
  cargarLista(): void {
    this.usuarioService.getUsuario().subscribe({
      next: (data) => {
        this.usuario = data;
        this.usuarioFiltrados = data;
      },
      error: (err) => {
        console.error('Error al obtener usuario:', err);
      },
    });
  }

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }
}
