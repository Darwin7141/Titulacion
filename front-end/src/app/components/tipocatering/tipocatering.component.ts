import { Component, OnInit} from '@angular/core';
import { TipocateringService } from '../../services/tipocatering.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Optional, Inject } from '@angular/core';

@Component({
  selector: 'app-tipocatering',
  standalone: false,
  
  templateUrl: './tipocatering.component.html',
  styleUrl: './tipocatering.component.css'
})
export class TipocateringComponent implements OnInit {
  tipo = {
    idtipo: '',
    nombre: '', // Para almacenar el valor de la contraseña
    descripcion: '',
    idestado: '',
  };

  estados: any[] = [];
  esEdicion = false;

    constructor(
      
      private serviceTipo: TipocateringService,
      private dialogRef: MatDialogRef<TipocateringComponent> ,
      private _router:Router,
      @Optional() @Inject(MAT_DIALOG_DATA) public data: any) {}
  
        ngOnInit():void {
          if (this.data?.tipo) {
    this.tipo = { ...this.data.tipo };   // precargar
    this.esEdicion     = true;
  }
          this.serviceTipo.getEstados().subscribe({
            next: (data) => {
              this.estados = data; // Asigna los cargos a la lista
            },
            error: (err) => {
              console.error('Error al obtener los estados:', err);
            },
          });
      
        }

    agregar() {
      this.serviceTipo.agregar(this.tipo).subscribe({
             next: () => {
               Swal.fire({ icon: 'success', title: 'Éxito', text: 'El tipo de catering se agregó correctamente.' })
                   .then(() => this.dialogRef.close('added'));   // ⬅️  cerramos pasando flag
             },
        error: (err) => {
          console.error('Error en enviar datos del tipo de catering:', err);
          // Aquí puedes manejar el error, como mostrar un mensaje al usuario
        },
      });
    }
     cancelar(): void {
    this.dialogRef.close();     // simplemente cierra sin flag
  }


  guardar(): void {
    
    
    const peticion$ = this.esEdicion
        ? this.serviceTipo.editarTipo(this.tipo)
        : this.serviceTipo.agregar(this.tipo);
  
    peticion$.subscribe({
      next : () => {
        Swal.fire({
          icon : 'success',
          title: 'Éxito',
          text : this.esEdicion
                 ? 'Tipo de catering actualizado correctamente.'
                 : 'Tipo de catering agregado correctamente.'
        }).then(() => this.dialogRef.close('saved'));
      },
      error: err => {
        console.error('Error al guardar el tipo:', err);
        Swal.fire({ icon:'error', title:'Error', text:'Ocurrió un error al guardar.' });
      }
    });
  
        }

  }
