import { Component, OnInit} from '@angular/core';
import { TipocateringService } from '../../services/tipocatering.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-tipocatering',
  standalone: false,
  
  templateUrl: './tipocatering.component.html',
  styleUrl: './tipocatering.component.css'
})
export class TipocateringComponent implements OnInit {
  tipo = {
    
    nombre: '', // Para almacenar el valor de la contraseña
    descripcion: '',
    idestado: '',
  };

  estados: any[] = [];
    constructor(
      
      private serviceTipo: TipocateringService,
      private dialogRef: MatDialogRef<TipocateringComponent> ,
      private _router:Router) {}
  
        ngOnInit():void {
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
  }
