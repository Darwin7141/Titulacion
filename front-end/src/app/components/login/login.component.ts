import { Component, OnInit, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { ServiciocateringService } from '../../services/serviciocatering.service';
import { ContactoService } from '../../services/contacto.service'; 
import jsPDF from 'jspdf';
import { MenusService } from '../../services/menus.service';
import { MatDialog, MatDialogRef  } from '@angular/material/dialog';

import { ValidacionesService } from '../../services/validaciones.service';
import { PreclientesService } from '../../services/preclientes.service';
import { RecuperarContrasenaService } from '../../services/recuperar-contrasena.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
    @ViewChild('loginDialog') loginDialog!: TemplateRef<any>;
    @ViewChild('registroDialog') registroDialog!: TemplateRef<any>;
    @ViewChild('recuperarDialog') recuperarDialog!: TemplateRef<any>;
  
    private registroRef?: MatDialogRef<any>;
    private recuperarRef?: MatDialogRef<any>;
   showLoginForm = false;
    servicio: any[] = [];
    servFiltrados: any[] = [];
    currentPage: number = 1;
    pageSize: number = 3;
  usuario = {
    correo: '', // Para almacenar el valor del nombre de usuario
    contrasenia: '', // Para almacenar el valor de la contraseña
  };

  registro = {
    ci: '',
    nombre: '',
    telefono: '',
    direccion: '',
    correo: '',
    contrasenia: ''
  };

  correoRecuperar = '';

  formData = {
    nombre: '',
    email: '',
    celular: '',
    serviciosSeleccionados: <string[]>[] // <-- un solo servicio
  };

  // Variables de control
  maxIntentos = 3;
  intentos = 0;
  tiempoBloqueo = 0;
  bloquearCampos = false;
  bloqueoTimeout: any;
  mostrarServicios = true;
  servicios: any[] = []; // aquí guardaremos los servicios
  menus: any[] = [];

  constructor(
    
    private _serviceLogin: LoginService,
    private _router: Router,
    private cateringService: ServiciocateringService,
    private contactoService: ContactoService,
    private menusService: MenusService,
    private dialog: MatDialog,
    private serviceRegistro: PreclientesService,
     private validaciones: ValidacionesService,
      private recuperarService: RecuperarContrasenaService,
  ) {}

  ngOnInit() : void {
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

      this.cargarServiciosYMenus();
  }
   
   abrirModal() {
    this.dialog.open(this.loginDialog, {
      width: '420px',
      // Optional: disableClose: true, autoFocus: false…
    });
  }
    
abrirRegistro() {
    this.registroRef = this.dialog.open(this.registroDialog, {
      width: '640px',
      autoFocus: false
    });
  
  }

  login() {
    if (this.bloquearCampos) {
        Swal.fire({
            icon: 'error',
            title: 'Demasiados intentos',
            text: 'Has excedido el número máximo de intentos. Intenta nuevamente en un minuto.',
        });
        return;
    }

    this._serviceLogin.login(this.usuario).subscribe({
        next: (response) => {
            // Si el login es exitoso, se restablece el contador de intentos
            this.intentos = 0;

            

            Swal.fire({
                icon: 'success',
                title: 'Inicio de sesión exitoso',
                showConfirmButton: false,
                timer: 1500,
            }).then(() => {
                // Redirigir según el valor del rol
                const rol = response.usuario.rol;
                this.dialog.closeAll();

               if (rol ===1) {
            // administrador
             
            this._router.navigate(['/admin/list/']);
          } else if (rol === 2) {
            // cliente
             
            this._router.navigate(['/inicioCliente/']);
            
          } else if (rol === 3) {
            // cliente
            this._router.navigate(['/inicioCliente/']);
          }else {
            // otros roles (empleado, precliente, etc.)
            Swal.fire({
              icon: 'error',
              title: 'Rol desconocido',
              text: 'No se reconoce el rol del usuario. Contacte al administrador.',
            });
                }
            });
        },
        error: (err) => {
            console.error('Error en el inicio de sesión:', err);

            if (err.status === 401) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Correo no encontrado',
                    text: 'El correo ingresado no existe en la base de datos.',
                });
            } else if (err.status === 400) {
                Swal.fire({
                    icon: 'error',
                    title: 'Contraseña incorrecta',
                    text: 'La contraseña ingresada es incorrecta.',
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error inesperado',
                    text: 'Ocurrió un error inesperado. Intenta nuevamente más tarde.',
                });
            }

            this.intentos++;

            if (this.intentos >= this.maxIntentos) {
                this.bloquearCampos = true;
                this.tiempoBloqueo = 60;

                Swal.fire({
                    icon: 'error',
                    title: 'Demasiados intentos',
                    text: 'Has excedido el número máximo de intentos. Intenta nuevamente en un minuto.',
                });

                this.bloqueoTimeout = setInterval(() => {
                    this.tiempoBloqueo--;
                    if (this.tiempoBloqueo <= 0) {
                        this.bloquearCampos = false;
                        clearInterval(this.bloqueoTimeout);
                    }
                }, 1000);
            }
        },
    });
}

scrollTo(id: string, event: Event) {
    event.preventDefault(); // Para que no recargue
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  get totalPages(): number {
    return Math.ceil(this.servFiltrados.length / this.pageSize);
  }
  
  get pagesArray(): number[] {
    return Array(this.totalPages).fill(0).map((_, i) => i + 1);
  }
  
  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  
  // Ejemplo de slice start/end
  get sliceStart(): number {
    return (this.currentPage - 1) * this.pageSize;
  }
  
  get sliceEnd(): number {
    return this.currentPage * this.pageSize;
  }

  onServicioChange(event: any, serv: any) {
    if (event.target.checked) {
      // Si se marca el checkbox, agregamos el ID (o el objeto) al array
      this.formData.serviciosSeleccionados.push(serv.nombre);
    } else {
      // Si se desmarca, lo quitamos del array
      this.formData.serviciosSeleccionados = this.formData.serviciosSeleccionados.filter(
        (id) => id !== serv.nombre
      );
    }
  }

  enviarFormulario() {
    console.log('Datos del formulario:', this.formData);

    this.contactoService.enviarContacto(this.formData)
      .subscribe({
        next: (resp) => {
          console.log('Respuesta del backend:', resp);
          alert('Tu solicitud ha sido enviada');

          // Limpieza
          this.formData = {
            nombre: '',
            email: '',
            celular: '',
            serviciosSeleccionados: []
          };
          this.mostrarServicios = true;
        },
        error: (err) => {
          console.error('Error al enviar contacto:', err);
          alert('Ocurrió un error al enviar tu solicitud, por favor intenta de nuevo.');
        }
      });
  }


  // Checkbox para mostrar/ocultar el select de servicio (opcional)
  toggleServicios(event: any) {
    this.mostrarServicios = event.target.checked;
    if (!this.mostrarServicios) {
      // Si ocultamos el select, vaciamos la selección
      this.formData.serviciosSeleccionados = [];
    }
  }

  cargarServiciosYMenus() {
    // 1) Obtener servicios
    this.cateringService.getServicio().subscribe({
      next: (data) => {
        // Ajustar si necesitas la URL de la imagen, como en tu LoginComponent
        this.servicios = data.map(serv => {
          const fotografiaUrl = `http://localhost:8010/api/getfotografia/${serv.imagen}/true`;
          return { ...serv, fotografiaUrl };
        });
        // 2) Obtener menús
        this.menusService.getMenu().subscribe({
          next: (dataMenus) => {
            // Ajustar igual que en listarmenus.component
            this.menus = dataMenus.map(m => {
              const fotoMenuUrl = `http://localhost:8010/api/getMenu/${m.imagen}/true`;
              return { ...m, fotoMenuUrl };
            });
          },
          error: (err2) => console.error('Error al obtener menús:', err2)
        });
      },
      error: (err1) => console.error('Error al obtener servicios:', err1)
    });
  }

  private checkAddPage(doc: jsPDF, yPos: number): number {
      // Altura de la página
      const pageHeight = doc.internal.pageSize.getHeight();
      // Si superamos un umbral (p.e. 270), creamos una nueva página y reiniciamos la posición
      if (yPos >= pageHeight - 20) {
        doc.addPage();
        return 20; // reiniciamos yPos a 20
      }
      return yPos;
    }


  async generarPDFServiciosMenus() {
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  
      // Fondo suave
      doc.setFillColor('#FFF8F2');
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
  
      let y = 70;
      const pageWidth = doc.internal.pageSize.getWidth();
  
      // Título general centrado
      doc.setFontSize(36);
      doc.setTextColor('#c08a68');
      doc.text('Catálogo de Servicios y Menús', pageWidth / 2, y, { align: 'center' });
      y += 50;
  
      // Para cada servicio (solo nombre centrado)
      for (const serv of this.servicios) {
        y = this.checkAddPage(doc, y);
  
        doc.setFontSize(20);
        doc.setTextColor('#6F4E37');
        doc.text(serv.nombre.toUpperCase(), pageWidth / 2, y, { align: 'center' });
        y += 40;
  
        // Menús de este servicio: imagen a la izquierda y texto a la derecha
        const menusDeEsteServicio = this.menus.filter(m => m.idservicio === serv.idservicio);
  
        for (const menu of menusDeEsteServicio) {
          y = this.checkAddPage(doc, y);
  
          // Imagen más grande: 80×80
          const imgX = 60;
          const imgY = y;
          const imgWidth = 80;
          const imgHeight = 80;
  
          if (menu.fotoMenuUrl) {
            try {
              // Convertimos la imagen con esquinas redondeadas
              const base64Rounded = await this.getBase64ImageRounded(menu.fotoMenuUrl, imgWidth, imgHeight, 10);
              doc.addImage(base64Rounded, 'PNG', imgX, imgY, imgWidth, imgHeight);
            } catch (err) {
              console.error('Error al convertir imagen del menú:', err);
            }
          }
  
          // Texto a la derecha
          let textX = imgX + imgWidth + 20;
          let currentY = imgY + 15;
  
          // Nombre del menú
          doc.setFontSize(14);
          doc.setTextColor('#6F4E37');
          doc.text(menu.nombre.toUpperCase(), textX, currentY);
          currentY += 18;
  
          // Descripción
          doc.setFontSize(12);
          doc.setTextColor('#333');
          const descLines = doc.splitTextToSize(menu.descripcion || '', 250); 
          doc.text(descLines, textX, currentY);
          currentY += descLines.length * 14 + 8;
  
          // Precio
          doc.setFontSize(14);
          doc.setTextColor('#6F4E37');
          doc.text(`$${menu.precio}`, textX, currentY);
  
          // Siguiente menú
          const usedHeight = Math.max(imgHeight, (currentY - imgY + 10));
          y += usedHeight + 20;
          y = this.checkAddPage(doc, y);
        }
  
        y += 50;
        y = this.checkAddPage(doc, y);
      }
  
      // Blob y enlace
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
  
      const linkHTML = `
        <a href="${pdfUrl}" download="catalogo_servicios_menus.pdf" target="_blank">
          Descargar PDF
        </a>
      `;
      doc.save('catalogo_servicios_menus.pdf');
    }
  
    /**
     * Redondea las esquinas de la imagen dibujándola en un canvas y haciendo "clip()" 
     * con un rectángulo redondeado. 
     */
    private async getBase64ImageRounded(
      url: string,
      width: number,
      height: number,
      radius: number
    ): Promise<string> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
  
        img.onload = () => {
          // Creamos un canvas del tamaño deseado
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto 2D'));
            return;
          }
  
          // Dibuja un rectángulo redondeado y hacemos clip
          ctx.beginPath();
          this.roundRectPath(ctx, 0, 0, width, height, radius);
          ctx.clip();
  
          // Ajustamos la imagen al canvas
          // Podrías usar 'drawImage(img, 0, 0, width, height);' 
          // si quieres forzar a que llene todo el recuadro
          ctx.drawImage(img, 0, 0, width, height);
  
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        };
  
        img.onerror = (error) => reject(error);
      });
    }
  
    /**
     * Traza una ruta de rectángulo con esquinas redondeadas en el context.
     */
    private roundRectPath(
      ctx: CanvasRenderingContext2D,
      x: number, 
      y: number, 
      w: number, 
      h: number,
      r: number
    ) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  
  
  
    getBase64ImageFromURL(url: string): Promise<string> {
      return new Promise((resolve, reject) => {
        const img = new Image();
        // Para evitar problemas de CORS
        img.crossOrigin = 'Anonymous';
        img.src = url;
    
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto 2D del canvas'));
            return;
          }
          ctx.drawImage(img, 0, 0);
          const dataURL = canvas.toDataURL('image/png');
          resolve(dataURL);
        };
    
        img.onerror = (error) => {
          reject(error);
        };
      });
    }

    toggleLogin() {
    this.showLoginForm = !this.showLoginForm;
  }

  onSubmit() {
          if (!this.validaciones.validarCedulaEcuador(this.registro.ci)) {
            Swal.fire({
              icon: 'error',
              title: 'Cédula no válida',
              text: 'La cédula ingresada no es válida.',
            });
            return;
          }
        
          if (!this.registro.nombre.trim()) {
            Swal.fire({
              icon: 'error',
              title: 'Nombre obligatorio',
              text: 'El nombre es obligatorio.',
            });
            return;
          }
        
          if (!this.registro.direccion.trim()) {
            Swal.fire({
              icon: 'error',
              title: 'Dirección obligatoria',
              text: 'La dirección es obligatoria.',
            });
            return;
          }
      
          if (!this.registro.contrasenia.trim()) {
            Swal.fire({
              icon: 'error',
              title: 'Contraseña obligatoria',
              text: 'La contraseña es obligatoria.',
            });
            return;
          }
        
      
          if (!this.validaciones.validarEmail(this.registro.correo)) {
            Swal.fire({
              icon: 'error',
              title: 'Correo no válido',
              text: 'El correo electrónico no es válido.',
            });
            return;
          }
        
          if (!this.validaciones.validarTelefono(this.registro.telefono)) {
            Swal.fire({
              icon: 'error',
              title: 'Teléfono no válido',
              text: 'El número de teléfono debe tener 10 dígitos y comenzar con 0.',
            });
            return;
          }
        
          // Lógica de verificación y envío
          this.serviceRegistro.verificarCedula(this.registro.ci).subscribe((resp) => {
            if (resp.existe) {
              Swal.fire({
                icon: 'warning',
                title: 'Cédula duplicada',
                text: 'La cédula ingresada ya existe en la base de datos.',
              });
              return;
            }
            this.serviceRegistro.verificarEmail(this.registro.correo).subscribe((resp) => {
              if (resp.existe) {
                Swal.fire({
                  icon: 'warning',
                  title: 'Correo duplicado',
                  text: 'El correo ingresado ya existe en la base de datos.',
                });
                return;
              }
              this.serviceRegistro.verificarTelefono(this.registro.telefono).subscribe((resp) => {
                if (resp.existe) {
                  Swal.fire({
                    icon: 'warning',
                    title: 'Teléfono duplicado',
                    text: 'El número de teléfono ingresado ya existe en la base de datos.',
                  });
                  return;
                }
        
                // Si todo es válido, agregar el administrador
                this.serviceRegistro.agregar(this.registro).subscribe({
                  next: (response) => {
                    Swal.fire({
                      icon: 'success',
                      title: 'Éxito',
                      text: 'Su registro se ha realizado exitosamente.',
                    }).then(() => {
                      
                      this._router.navigate(['/login'])
                      this.registroRef?.close();
                      
                      
                    });
                  },
                  error: (err) => {
                    console.error('Error en enviar datos del registro:', err);
                    Swal.fire({
                      icon: 'error',
                      title: 'Error',
                      text: 'Ocurrió un error al generar el registro.',
                    });
                  },
                });
              });
            });
          });
        }

   closeRegistro() {
    this.registroRef?.close();
    this._router.navigate(['/login']);
  }
  
  abrirRecuperar() {
    this.recuperarRef = this.dialog.open(this.recuperarDialog, {
      width: '360px',
      panelClass: 'recuperar-dialog-container',
      backdropClass: 'recuperar-dialog-backdrop',
      autoFocus: false
    });
  }
  closeRecuperar() {
    this.recuperarRef?.close();
  }

  solicitarRecuperacion() {
    if (!this.correoRecuperar) return;
    this.recuperarService.solicitarRecuperacion({ correo: this.correoRecuperar })
      .subscribe({
        next: () => Swal.fire({
                      icon: 'success',
                      title: 'Éxito',
                      text: 'Revisa tu correo para reestablecer tu contraseña.',
                    })
                         .then(() => this.closeRecuperar()),
        error: () => Swal.fire('Error enviando correo','error')
      });
  }
  }

  

