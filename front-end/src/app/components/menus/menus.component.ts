import { Component, OnInit,Optional, Inject  } from '@angular/core';
import { MenusService } from '../../services/menus.service';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of } from 'rxjs';              
import Swal  from 'sweetalert2';

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
      @Optional() private dialogRef: MatDialogRef<MenusComponent>,
      @Optional() @Inject(MAT_DIALOG_DATA) private data: any,
      private _router:Router) {}

      private get esDialogo(): boolean { return !!this.dialogRef; }
    private irALista(): void { this._router.navigate(['/listaMenus']); }
  
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
    this.isLoading = true;

    this.menuCatering.agregar(this.menu).subscribe({
      next : ({ idmenu }) => {

        /* subimos la imagen solo si existe */
        const subir$ = this.nuevaImagen
          ? this.menuCatering.subirImagenServicio(this.nuevaImagen, idmenu)
          : of(null);

        subir$.subscribe({
          next : ()  => this.finalizaExito(),
          error: err => this.finalizaError('al subir la imagen', err)
        });
      },
      error: err => this.finalizaError('al crear el menú', err)
    });
  }

  /* ---------------- cancelar ---------------- */
  cancelar(): void {
    this.esDialogo ? this.dialogRef!.close()
                   : this.irALista();
  }

  /* ---------------- helpers privados ---------------- */
  private finalizaExito(): void {
    this.isLoading = false;
    Swal.fire({ icon:'success', title:'Éxito', text:'Menú agregado correctamente.' })
      .then(() => this.esDialogo ? this.dialogRef!.close('added')
                                 : this.irALista());
  }

  private finalizaError(msg: string, err: any): void {
    this.isLoading = false;
    console.error(`Error ${msg}:`, err);
    Swal.fire({ icon:'error', title:'Error', text:`Ocurrió un error ${msg}.` });
  }
}
      




