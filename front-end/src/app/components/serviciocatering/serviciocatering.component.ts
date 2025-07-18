import { Component, OnInit } from '@angular/core';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { TipocateringService } from '../../services/tipocatering.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';
import { Optional } from '@angular/core';
import { of } from 'rxjs'; 
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';


@Component({
  selector: 'app-serviciocatering',
  standalone: false,
  
  templateUrl: './serviciocatering.component.html',
  styleUrl: './serviciocatering.component.css'
})
export class ServiciocateringComponent implements OnInit {
  servicio = {
    idservicio: '', 
    nombre: '',
    descripcion: '',
    idtipo: '',
    idestado: '',
  };

  tipo: any[] = [];
  estados: any[] = [];

  nuevaImagen: File | null = null;
  isLoading: boolean = false;
  esEdicion = false;

    constructor(
      
      private tipoService: TipocateringService,
      private serviceTipo: TipocateringService,
      private servCatering: ServiciocateringService,
      @Optional() private dialogRef: MatDialogRef<ServiciocateringComponent> ,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
      
      private _router:Router) {}
  
        ngOnInit():void {
          if (this.data?.servicio) {
          this.servicio= { ...this.data.servicio};   // precargar
          this.esEdicion     = true;
  }


          this.tipoService.getTipo().subscribe({
            next: (data) => {
              this.tipo = data; // Asigna los cargos a la lista
            },
            error: (err) => {
              console.error('Error al obtener los tipos:', err);
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
      
        }

        onNewImageSelected(event: any): void {
          if (event.target.files && event.target.files.length > 0) {
            this.nuevaImagen = event.target.files[0];
            console.log('Imagen seleccionada:', this.nuevaImagen);
          }
        }

        private get esDialogo(): boolean { return !!this.dialogRef; }

        private irALista(): void { this._router.navigate(['/listaServicios']); }
        

  agregar(): void {
  this.isLoading = true;              // spinner ON

  this.servCatering.agregar(this.servicio).subscribe({
    next: ({ idservicio }) => {
      // (A) si hay imagen, súbela primero
      const subir = this.nuevaImagen
        ? this.servCatering.subirImagenServicio(this.nuevaImagen, idservicio)
        : of(null);                   // from 'rxjs'

      subir.subscribe({
        next: () => finalizaExito(),
        error: err => finalizaError('al subir la imagen', err)
      });
    },
    error: err => finalizaError('al crear el servicio', err)
  });

  /* ---------- helpers internas ---------- */
  const finalizaExito = () => {
    this.isLoading = false;
    Swal.fire({ icon:'success', title:'Éxito', text:'Servicio agregado correctamente.' })
      .then(() => {
        if (this.esDialogo) {
          this.dialogRef!.close('added');   // notifica a la lista
        } else {
          this.irALista();                  // navegación normal
        }
      });
  };

  const finalizaError = (msg: string, err: any) => {
    this.isLoading = false;
    console.error(`Error ${msg}:`, err);
    Swal.fire({ icon:'error', title:'Error', text:`Ocurrió un error ${msg}.` });
  };
}

cancelar(): void {
  this.esDialogo ? this.dialogRef!.close()
                 : this.irALista();
}

guardar(): void {
    this.isLoading = true;

    // 1) Decide si crea o actualiza
    const accion$ = this.esEdicion
      ? this.servCatering.editarServicio(this.servicio)    // PUT /servicios/:id
      : this.servCatering.agregar(this.servicio);          // POST /servicios

    accion$.subscribe({
      next: (res: any) => {
        // 2) Obtén el idservicio
        const idservicio = this.esEdicion
          ? this.servicio.idservicio
          : res.idservicio;

        // 3) Si seleccionaste imagen, súbela ahora
        const upload$ = this.nuevaImagen
          ? this.servCatering.subirImagenServicio(this.nuevaImagen, idservicio)
          : of(null);

        upload$.subscribe({
          next: () => this.finalizaExito(),
          error: err => this.finalizaError('al subir la imagen', err)
        });
      },
      error: err => this.finalizaError('al guardar el servicio', err)
    });
  }

  private finalizaExito(): void {
    this.isLoading = false;
    Swal.fire({
      icon: 'success',
      title: 'Éxito',
      text: this.esEdicion
        ? 'Servicio actualizado correctamente.'
        : 'Servicio agregado correctamente.'
    }).then(() => {
      if (this.esDialogo) {
        this.dialogRef!.close(this.esEdicion ? 'saved' : 'added');
      } else {
        this.irALista();
      }
    });
  }

  private finalizaError(msg: string, err: any): void {
    this.isLoading = false;
    console.error(`Error ${msg}:`, err);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `Ocurrió un error ${msg}.`
    });
  }

}

