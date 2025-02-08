import { Component, OnInit } from '@angular/core';
import { MenusService } from '../../services/menus.service';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-menus',
  standalone: false,
  
  templateUrl: './menus.component.html',
  styleUrl: './menus.component.css'
})
export class MenusComponent implements OnInit {
  menu = {
    
    nombre: '', // Para almacenar el valor de la contraseña
    descripcion: '',
    precio: '',
    idservicio: '',
  };

  tipo: any[] = [];
  nuevaImagen: File | null = null;
  isLoading: boolean = false;
    constructor(
      
      private servCatering: ServiciocateringService,
      private menuCatering: MenusService,

      
      private _router:Router) {}
  
        ngOnInit():void {
          this.servCatering.getServicio().subscribe({
            next: (data) => {
              this.tipo = data; // Asigna los cargos a la lista
            },
            error: (err) => {
              console.error('Error al obtener los servicios:', err);
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
          this.menuCatering.agregar(this.menu).subscribe({
            next: (response) => {
              const idmenu = response.idmenu;
              console.log('Menú creado con ID:', idmenu);
      
              // 3) Subir imagen (si existe)
              if (this.nuevaImagen) {
                this.menuCatering.subirImagenServicio(this.nuevaImagen, idmenu)
                  .subscribe({
                    next: (resUpload) => {
                      console.log('Imagen subida correctamente:', resUpload);
                      this.isLoading = false; // Desactivar spinner
                      this._router.navigate(['/listaMenus']);
                    },
                    error: (err) => {
                      this.isLoading = false; // desactivar spinner
                      console.error('Error al subir la imagen:', err);
                    },
                  });
              } else {
                this.isLoading = false; // desactivar spinner
                this._router.navigate(['/listaMenus']);
              }
            },
            error: (err) => {
              this.isLoading = false; // desactivar spinner
              console.error('Error al crear el servicio', err);
            },
          });
        }
      }




