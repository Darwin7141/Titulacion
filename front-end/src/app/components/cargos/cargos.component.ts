import { Component, OnInit} from '@angular/core';
import { CargosService } from '../../services/cargos.service';
import { Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-cargos',
  standalone: false,
  
  templateUrl: './cargos.component.html',
  styleUrl: './cargos.component.css'
})
export class CargosComponent implements OnInit {
  cargos = {
     // Para almacenar el valor del nombre de usuario
    nombrecargo: '', // Para almacenar el valor de la contraseña
    descripcion: '',
    
  };
    constructor(
      
      private cargoService: CargosService,
        private _router:Router,
      private dialogRef: MatDialogRef<CargosComponent> ) {}
  
    ngOnInit():void {
      
    }
    agregar() {
      this.cargoService.agregar(this.cargos).subscribe({
              next: () => {
                Swal.fire({ icon: 'success', title: 'Éxito', text: 'Cargo agregado correctamente.' })
                    .then(() => this.dialogRef.close('added'));   // ⬅️  cerramos pasando flag
              },
        error: (err) => {
          console.error('Error en enviar datos del cargo:', err);
          // Aquí puedes manejar el error, como mostrar un mensaje al usuario
        },
      });
    }
    cancelar(): void {
    this.dialogRef.close();     // simplemente cierra sin flag
  }
  }
