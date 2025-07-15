import { Component, OnInit } from '@angular/core';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { TipocateringService } from '../../services/tipocatering.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';
import { Optional } from '@angular/core';
import { of } from 'rxjs'; 


@Component({
  selector: 'app-serviciocatering',
  standalone: false,
  
  templateUrl: './serviciocatering.component.html',
  styleUrl: './serviciocatering.component.css'
})
export class ServiciocateringComponent implements OnInit {
  servicio = {
    
    nombre: '', // Para almacenar el valor de la contraseña
    descripcion: '',
    idtipo: '',
    idestado: '',
  };

  tipo: any[] = [];
  estados: any[] = [];

  nuevaImagen: File | null = null;
  isLoading: boolean = false;
    constructor(
      
      private tipoService: TipocateringService,
      private serviceTipo: TipocateringService,
      private servCatering: ServiciocateringService,
      @Optional() private dialogRef: MatDialogRef<ServiciocateringComponent> ,
      
      private _router:Router) {}
  
        ngOnInit():void {
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

      }

