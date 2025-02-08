import { Component, OnInit} from '@angular/core';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { TipocateringService } from '../../services/tipocatering.service';

@Component({
  selector: 'app-listarservicio',
  standalone: false,
  
  templateUrl: './listarservicio.component.html',
  styleUrl: './listarservicio.component.css'
})
export class ListarservicioComponent implements OnInit {
  servicio: any[] = [];
  servFiltrados: any[] = [];
  searchTerm: string = '';
  isEditMode: boolean = false;
  servSeleccionado: any = null;
  tipo: any[] = [];
  estados: any[] = [];

  isLoading: boolean = false;

  constructor(
    private cateringService: ServiciocateringService,
    private serviceTipo: TipocateringService,
    private tipoCatering: TipocateringService
  ) {}

  ngOnInit(): void {
    this.tipoCatering.getTipo().subscribe({
      next: (data) => {
        this.tipo = data; // Asigna los cargos a la lista
      },
      error: (err) => {
        console.error('Error al obtener cargos:', err);
      },
    });

    this.serviceTipo.getEstados().subscribe({
      next: (data) => {
        this.estados = data; // Asigna los cargos a la lista
      },
      error: (err) => {
        console.error('Error al obtener los estados:', err);
      },
    });
   
    this.obtenerServicios();
    this.cargarLista();
  }

  obtenerServicios(): void {
    this.cateringService.getServicio().subscribe({
      next: (data) => {
        // Transformamos cada servicio para que tenga 'fotografiaUrl'
        this.servicio = data.map(serv => {
          const fotografiaUrl = `http://localhost:8010/api/getfotografia/${serv.imagen}/true`;
          return { ...serv, fotografiaUrl };
        });
        this.servFiltrados = this.servicio;
      },
      error: (err) => {
        console.error('Error al obtener los servicios:', err);
      },
    });
  }
  

  

  buscarServicios(): void {
    const searchTermLower = this.searchTerm.trim().toLowerCase(); // Normalizamos el término de búsqueda
    if (searchTermLower === '') {
      this.servFiltrados = this.servicio; // Si no hay búsqueda, mostramos todos los productos
    } else {
      this.servFiltrados = this.servicio.filter((servicio) =>
        servicio.nombre.toLowerCase().includes(searchTermLower) ||
        servicio.idservicio.toLowerCase().includes(searchTermLower) // Filtra también por código
      );
    }
  }

  editarServicios(servicio: any): void {
    this.isEditMode = true;
    this.servSeleccionado = { ...servicio }; // Copia para evitar modificar el original
  }

  guardarEdicion(): void {
    if (this.servSeleccionado) {
      const idServicio = this.servSeleccionado.idservicio;

      // Activar spinner
      this.isLoading = true;

      // Si el usuario seleccionó una nueva imagen
      if (this.nuevaImagen) {
        this.cateringService.subirImagenServicio(this.nuevaImagen, idServicio)
          .subscribe({
            next: (res) => {
              this.servSeleccionado.imagen = res.fotografia.imagen;
              // Ahora actualizamos los demás campos del servicio
              this.actualizarServicio();
            },
            error: (err) => {
              this.isLoading = false; // desactivar spinner en caso de error
              console.error('Error al subir imagen:', err);
            }
          });
      } else {
        // Si no hay imagen nueva, actualizamos directamente
        this.actualizarServicio();
      }
    }
  }

  private actualizarServicio(): void {
    this.cateringService.editarServicio(this.servSeleccionado).subscribe({
      next: () => {
        // Al terminar la actualización, ocultar spinner
        this.isLoading = false;
        this.isEditMode = false;
        this.servSeleccionado = null;
        this.nuevaImagen = null;
        this.obtenerServicios();
      },
      error: (err) => {
        this.isLoading = false; // desactivar spinner en caso de error
        console.error('Error al actualizar el servicio:', err);
      },
    });
  }

  

  eliminarServicios(idservicio: string): void {
    if (confirm('¿Está seguro de que desea eliminar este servicio?')) {
      this.cateringService.eliminarServicio(idservicio).subscribe({
        next: () => {
          this.obtenerServicios();
        },
        error: (err) => {
          console.error('Error al eliminar el servicio:', err);
        },
      });
    }
  }

  cancelarEdicion(): void {
    this.isEditMode = false;
    this.servSeleccionado = null;
  }
  cargarLista(): void {
    this.cateringService.getServicio().subscribe({
      next: (data) => {
        this.servicio = data.map(serv => {
          const fotografiaUrl = `http://localhost:8010/api/getfotografia/${serv.imagen}/true`;
          return { ...serv, fotografiaUrl };
        });
        this.servFiltrados = this.servicio;
      },
      error: (err) => {
        console.error('Error al obtener los servicios:', err);
      },
    });
  }
  

  recargarLista(): void {
    this.searchTerm = '';
    this.cargarLista();
  }

  nuevaImagen: File | null = null;

onNewImageSelected(event: any): void {
  if (event.target.files && event.target.files.length > 0) {
    this.nuevaImagen = event.target.files[0];
    console.log('Nueva imagen seleccionada:', this.nuevaImagen);
    // Aquí podrías generar una vista previa, etc.
  }
}
}

