import { Component, Inject} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-dialogo',
  standalone: false,
  
  templateUrl: './dialogo.component.html',
  styleUrl: './dialogo.component.css'
})
export class DialogoComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { titulo: string; mensaje: string }) {}
}
