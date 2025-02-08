import { Component, OnInit } from '@angular/core';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { TipocateringService } from '../../services/tipocatering.service';
import { Router } from '@angular/router';


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
        

        agregar(): void {
          // 1) Activar spinner
          this.isLoading = true;
      
          // 2) Crear servicio
          this.servCatering.agregar(this.servicio).subscribe({
            next: (response) => {
              const idservicio = response.idservicio;
              console.log('Servicio creado con ID:', idservicio);
      
              // 3) Subir imagen (si existe)
              if (this.nuevaImagen) {
                this.servCatering.subirImagenServicio(this.nuevaImagen, idservicio)
                  .subscribe({
                    next: (resUpload) => {
                      console.log('Imagen subida correctamente:', resUpload);
                      this.isLoading = false; // Desactivar spinner
                      this._router.navigate(['/listaServicios']);
                    },
                    error: (err) => {
                      this.isLoading = false; // desactivar spinner
                      console.error('Error al subir la imagen:', err);
                    },
                  });
              } else {
                this.isLoading = false; // desactivar spinner
                this._router.navigate(['/listaServicios']);
              }
            },
            error: (err) => {
              this.isLoading = false; // desactivar spinner
              console.error('Error al crear el servicio', err);
            },
          });
        }
      }

