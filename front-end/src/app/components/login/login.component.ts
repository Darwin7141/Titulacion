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
import { finalize } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  isLoadingRecuperar = false;

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
    this.servicio = (data || []).map((serv: any) => ({
      ...serv,
      // usa la miniatura; si no hay imagen, deja null
      fotografiaUrl: serv?.imagen
        ? this.cateringService.getFotoUrl(serv.imagen, true)
        : null,
    }));
    this.servFiltrados = this.servicio;
    
  },
  error: (err) => console.error('Error al obtener los servicios:', err),
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
      width: 480,
      html: `
        <div class="swal-pro-warn"></div>
        <h2 class="swal-pro-title">Demasiados intentos</h2>
        <p class="swal-pro-desc">Has excedido el número máximo de intentos. Intenta nuevamente en un minuto.</p>
      `,
      showConfirmButton: true,
      confirmButtonText: 'Entendido',
      buttonsStyling: false,
      customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
    });
    return;
  }

    this._serviceLogin.login(this.usuario).subscribe({
        next: (response) => {
            // Si el login es exitoso, se restablece el contador de intentos
            this.intentos = 0;
            Swal.fire({
                 width: 480,
                 html: `
                <div class="swal-pro-check"></div>
                <h2 class="swal-pro-title">Inicio de sesión exitoso</h2>
                 <p class="swal-pro-desc">Bienvenido/a.</p>`,
        showConfirmButton: true,
        confirmButtonText: 'Listo',
        buttonsStyling: false,
        customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
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
             width: 480,
            html: `
              <div class="swal-pro-error"></div>
              <h2 class="swal-pro-title">Usuario no registrado</h2>
              <p class="swal-pro-desc">No se reconoce al usuario. Contacte al administrador.</p>
            `,
            showConfirmButton: true,
            confirmButtonText: 'Entendido',
            buttonsStyling: false,
            customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
            });
                }
            });
        },
        error: (err) => {
            console.error('Error en el inicio de sesión:', err);

            if (err.status === 401) {
                Swal.fire({
                    width: 480,
          html: `
            <div class="swal-pro-warn"></div>
            <h2 class="swal-pro-title">Correo no encontrado</h2>
            <p class="swal-pro-desc">El correo ingresado no se encuentra registrado.</p>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Entendido',
          buttonsStyling: false,
          customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
                });
            } else if (err.status === 400) {
                Swal.fire({
                    width: 480,
          html: `
            <div class="swal-pro-error"></div>
            <h2 class="swal-pro-title">Contraseña incorrecta</h2>
            <p class="swal-pro-desc">La contraseña ingresada es incorrecta.</p>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Entendido',
          buttonsStyling: false,
          customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
                });
            } else {
                Swal.fire({
                    width: 480,
          html: `
            <div class="swal-pro-error"></div>
            <h2 class="swal-pro-title">Error inesperado</h2>
            <p class="swal-pro-desc">Ocurrió un error inesperado. Intenta nuevamente más tarde.</p>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Entendido',
          buttonsStyling: false,
          customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
                });
            }

            this.intentos++;

            if (this.intentos >= this.maxIntentos) {
                this.bloquearCampos = true;
                this.tiempoBloqueo = 60;

                Swal.fire({
                   width: 480,
          html: `
            <div class="swal-pro-warn"></div>
            <h2 class="swal-pro-title">Demasiados intentos</h2>
            <p class="swal-pro-desc">Has excedido el número máximo de intentos. Intenta nuevamente en un minuto.</p>
          `,
          showConfirmButton: true,
          confirmButtonText: 'Entendido',
          buttonsStyling: false,
          customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
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

cerrar() {
  this.showLoginForm = false;
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
      this.servicios = (data || []).map(serv => ({
        ...serv,
        fotografiaUrl: serv?.imagen
          ? this.cateringService.getFotoUrl(serv.imagen, true)
          : null
      }));
      // 2) Obtener menús
      this.menusService.getMenu().subscribe({
        next: (dataMenus) => {
          this.menus = (dataMenus || []).map(m => ({
            ...m,
            fotoMenuUrl: m?.imagen
              ? this.menusService.getMenuFotoUrl(m.imagen, true)
              : null
          }));
        },
        error: (err2) => console.error('Error al obtener menús:', err2)
      });
    },
    error: (err1) => console.error('Error al obtener servicios:', err1)
  });
  }

// ===== Helpers (NO async) =====
private fitFontSizeToMaxLine(
  doc: jsPDF,
  lines: string[],
  desiredSize: number,
  maxWidth: number,
  minSize = 14
): number {
  doc.setFontSize(desiredSize);
  const longest = Math.max(...lines.map(t => doc.getTextWidth(t)));
  if (longest <= maxWidth) return desiredSize;

  const scaled = Math.floor(desiredSize * (maxWidth / longest));
  return Math.max(minSize, scaled);
}

/** Dibuja varias líneas centradas y devuelve el Y (baseline) de la última línea. */
private drawCenteredLines(
  doc: jsPDF,
  lines: string[],
  centerX: number,
  startY: number,
  fontSize: number,
  lineGap = 6
): number {
  doc.setFontSize(fontSize);
  const lineH = fontSize * 1.2;
  let y = startY;
  lines.forEach((t, i) => {
    doc.text(t, centerX, y, { align: 'center' });
    if (i < lines.length - 1) y += lineH + lineGap;
  });
  return y;
}

// PDF Catalogo
// PDF Catálogo (ACTUALIZADO: con descripción bajo el nombre)
async generarPDFServiciosMenus() {
  const doc   = new jsPDF({ unit: 'pt', format: 'letter', orientation: 'portrait' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const M  = 36;
  const G  = 26;
  const W  = pageW - M * 2;
  const CW = (W - G) / 2;
  const CX = [M, M + CW + G];

  const TITLE_Y     = M + 30;
  const BODY_Y_BASE = M + 92;            // base mínima
  const BODY_B      = pageH - M - 34;

  // se recalcula por página según el alto real del título
  let BODY_Y = BODY_Y_BASE;

  // Imágenes/filas
  const IMG   = { w: 64, h: 64, r: 40 };
  const ROW_H_MIN = IMG.h + 14;          // alto mínimo de fila (imagen + padding)

  // Encabezado de servicio
  const RHDR_H        = 30;
  const HDR_BLOCK_H   = RHDR_H + 12;     // alto real ocupado por el header

  const NAME_COLOR  = '#55311F';
  const PRICE_COLOR = '#55311F';
  const MUTED       = '#6B7280';

  // ---------- Página (fondo + título auto-fit + pie) ----------
  const dibujarPagina = () => {
    doc.setFillColor('#F7F4EF'); doc.rect(0, 0, pageW, pageH, 'F');
    doc.setFillColor('#FFFFFF');
    doc.roundedRect(M - 6, M - 6, pageW - (M - 6) * 2, pageH - (M - 6) * 2, 10, 10, 'F');

    // título en dos líneas auto-ajustado
    const titleLines = ['Catálogo de', 'Servicios y Menús'];
    const innerW     = pageW - (M - 6) * 2;
    const maxTitleW  = innerW - 24;

    doc.setFont('helvetica', 'bold'); doc.setTextColor('#A45B35');
    const titleSize  = this.fitFontSizeToMaxLine(doc, titleLines, 40, maxTitleW, 18);
    const lastTitleY = this.drawCenteredLines(doc, titleLines, pageW / 2, TITLE_Y, titleSize, 4);

    doc.setDrawColor(220);
    doc.line(M, lastTitleY + 10, pageW - M, lastTitleY + 10);

    // el cuerpo empieza debajo del título real
    BODY_Y = Math.max(BODY_Y_BASE, lastTitleY + 24);
  };

  // ---------- control de columnas/página ----------
  let col = 0;            // 0 = izquierda, 1 = derecha
  let y   = 0;

  const pasarSiguienteColumna = (): 'same-page' | 'new-page' => {
    col++;
    if (col > 1) {
      doc.addPage();
      dibujarPagina();
      col = 0;
      y = BODY_Y;
      return 'new-page';
    }
    y = BODY_Y;
    return 'same-page';
  };

  const asegurarEspacio = (necesario: number) => {
    if (y + necesario > BODY_B) pasarSiguienteColumna();
  };

  // ---------- encabezado de servicio ----------
  const dibujarEncabezadoServicio = (titulo: string, continuacion = false) => {
    const x = CX[col], width = CW;

    doc.setFillColor('#F2E7DA');
    doc.roundedRect(x, y, width, RHDR_H, 8, 8, 'F');

    const texto = (continuacion ? `${titulo} (cont.)` : titulo).toUpperCase();
    const maxW  = width - 32; // padding interior
    doc.setFont('helvetica', 'bold'); doc.setTextColor(NAME_COLOR);
    const fz = this.fitFontSizeToMaxLine(doc, [texto], 13, maxW, 10);
    doc.setFontSize(fz);
    doc.text(texto, x + width / 2, y + 20, { align: 'center' });

    y += HDR_BLOCK_H;
  };

  // ---------- MEDIDOR: alto real de la fila según nombre + descripción ----------
  // ---------- MEDIDOR: alto real con nombre arriba + precio en la misma línea ----------
// ---------- MEDIDOR: alto real con nombre arriba + precio en la misma línea ----------
const medirAltoFilaMenu = (menu: any, anchoTexto: number) => {
  const ANCHO_PRECIO = 64;
  const GAP_PRECIO   = 8;

  // El bloque de texto (nombre y descripción) llega hasta donde termina el precio
  const anchoBloque = Math.max(60, anchoTexto - ANCHO_PRECIO - GAP_PRECIO);

  // Tipos
  const FS_NOMBRE_BASE = 11;
  const FS_DESC        = 9;
  const LH_NOMBRE      = FS_NOMBRE_BASE * 1.22;
  const LH_DESC        = FS_DESC * 1.28;

  // Nombre en UNA línea (auto-fit)
  const nombre   = String(menu.nombre || '').toUpperCase().trim();
  const fzNombre = this.fitFontSizeToMaxLine(doc, [nombre], FS_NOMBRE_BASE, anchoBloque, 8);

  // Descripción envuelta con el MISMO ancho del bloque (no pasa bajo el precio)
  const desc        = String(menu.descripcion || '').trim();
  const lineasDesc  = desc ? doc.splitTextToSize(desc, anchoBloque) : [];
  const GAP         = lineasDesc.length ? 2 : 0;

  // Alto del texto
  const altoTexto = (fzNombre * 1.22) + GAP + (lineasDesc.length * LH_DESC);

  // Paddings más pequeños para compactar
  const PAD_SUP = 6, PAD_INF = 6;

  return Math.max(ROW_H_MIN, altoTexto + PAD_SUP + PAD_INF);
};



 // ---------- DIBUJADOR: imagen izquierda, nombre ↑ y precio en la misma línea ----------
const dibujarFilaMenu = async (menu: any, altoFila: number) => {
  const x = CX[col], width = CW;

  // Layout compacto
  const PAD_SUP = 6, PAD_INF = 6;
  const ANCHO_PRECIO = 64, GAP_PRECIO = 8;

  // IMAGEN (64x64)
  const imgX = x + 6;
  const imgY = y + PAD_SUP;
  try {
    if (menu.fotoMenuUrl) {
      const base64 = await this.getBase64ImageRounded(menu.fotoMenuUrl, IMG.w, IMG.h, IMG.r);
      doc.addImage(base64, 'PNG', imgX, imgY, IMG.w, IMG.h);
    } else {
      doc.setFillColor('#F3F4F6');
      doc.roundedRect(imgX, imgY, IMG.w, IMG.h, IMG.r, IMG.r, 'F');
    }
  } catch {
    doc.setFillColor('#F3F4F6');
    doc.roundedRect(imgX, imgY, IMG.w, IMG.h, IMG.r, IMG.r, 'F');
  }

  // ÁREAS DE TEXTO
  const textoX      = imgX + IMG.w + 10;
  const textoMax    = x + width - textoX - 12;
  const anchoBloque = Math.max(60, textoMax - ANCHO_PRECIO - GAP_PRECIO); // nombre+desc
  const FS_NOMBRE_BASE = 11, FS_DESC = 9;

  // Nombre (una línea, auto-fit)
  const nombre   = String(menu.nombre || '').toUpperCase().trim();
  const fzNombre = this.fitFontSizeToMaxLine(doc, [nombre], FS_NOMBRE_BASE, anchoBloque, 8);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(fzNombre); doc.setTextColor(NAME_COLOR);

  const yNombre = y + PAD_SUP + fzNombre;     // alineado al tope de la imagen
  doc.text(nombre, textoX, yNombre);          // sin maxWidth: 1 sola línea

  // Precio (misma línea, a la derecha)
  const precioTxt = `$${Number(menu.precio ?? 0).toFixed(2)}`;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(fzNombre); doc.setTextColor(PRICE_COLOR);
  doc.text(precioTxt, x + width - 6, yNombre, { align: 'right' });

  // Descripción (debajo, con el MISMO ancho del bloque → queda alineada con el precio)
  const desc = String(menu.descripcion || '').trim();
  if (desc) {
    const lineasDesc = doc.splitTextToSize(desc, anchoBloque);
    const yDesc = yNombre + 2 + FS_DESC * 0.9;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(FS_DESC); doc.setTextColor(MUTED);
    doc.text(lineasDesc, textoX, yDesc);
  }

  // Separador fino y avance
  doc.setDrawColor(235);
  doc.line(x, y + altoFila, x + width, y + altoFila);
  y += altoFila;
};


  dibujarPagina();
  col = 0;
  y   = BODY_Y;

  // Recorremos servicios de forma secuencial (flujo 2 columnas)
  for (const s of this.servicios) {
    const tituloServicio = String(s?.nombre || '').trim();

    // Menús de ese servicio (ordenados)
    const menus = this.menus
      .filter((m: any) => m.idservicio === s.idservicio)
      .sort((a: any, b: any) => String(a.nombre || '').localeCompare(String(b.nombre || '')));

    // aseguro que quepa header + al menos 1 fila mínima
    asegurarEspacio(HDR_BLOCK_H + ROW_H_MIN);
    dibujarEncabezadoServicio(tituloServicio, false);

    for (let i = 0; i < menus.length; i++) {
      // calcular alto real de esta fila según su texto
      const x = CX[col], width = CW;
      const textoX   = (x + 6) + IMG.w + 10;
      const textoMax = x + width - textoX - 60;
      const altoNecesario = medirAltoFilaMenu(menus[i], textoMax);

      if (y + altoNecesario > BODY_B) {
        const mov = pasarSiguienteColumna();
        // repetir encabezado SOLO si cambiamos de página
        if (mov === 'new-page') {
          dibujarEncabezadoServicio(tituloServicio, true); // "(cont.)"
        }
      }

      await dibujarFilaMenu(menus[i], altoNecesario);
    }

    // pequeño respiro tras terminar un servicio
    asegurarEspacio(12);
    y += 12;
  }

  doc.save('catalogo.pdf');
}




async addPageNumbers(doc: jsPDF, pageW: number, pageH: number) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor('#9CA3AF');
    const txt = `Página ${i} de ${total}`;
    doc.text(txt, pageW - 42, pageH - 18, { align: 'right' });
  }
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
                 width: 480,
                 html: `
                   <div class="swal-pro-error"></div>
                   <h2 class="swal-pro-title">Cédula no válida</h2>
                   <p class="swal-pro-desc">La cédula ingresada no es válida.</p>
                 `,
                 showConfirmButton: true,
                 confirmButtonText: 'Listo',
                 buttonsStyling: false,
                 focusConfirm: true,
                 customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
               });
               return;
          }
        
          if (!this.registro.nombre.trim()) {
            Swal.fire({
                  width: 480,
                  html: `
                    <div class="swal-pro-warn"></div>
                    <h2 class="swal-pro-title">Nombre obligatorio</h2>
                    <p class="swal-pro-desc">El nombre es obligatorio.</p>
                  `,
                  showConfirmButton: true,
                  confirmButtonText: 'Listo',
                  buttonsStyling: false,
                  focusConfirm: true,
                  customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
                });
                return;
          }
        
          if (!this.registro.direccion.trim()) {
             Swal.fire({
                  width: 480,
                  html: `
                    <div class="swal-pro-warn"></div>
                    <h2 class="swal-pro-title">Dirección obligatoria</h2>
                    <p class="swal-pro-desc">La dirección es obligatoria.</p>
                  `,
                  showConfirmButton: true,
                  confirmButtonText: 'Listo',
                  buttonsStyling: false,
                  focusConfirm: true,
                  customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
                });
                return;
          }
      
          if (!this.registro.contrasenia.trim()) {
            Swal.fire({
                  width: 480,
                  html: `
                    <div class="swal-pro-warn"></div>
                    <h2 class="swal-pro-title">Contraseña obligatoria</h2>
                    <p class="swal-pro-desc">La contraseña es obligatoria.</p>
                  `,
                  showConfirmButton: true,
                  confirmButtonText: 'Listo',
                  buttonsStyling: false,
                  focusConfirm: true,
                  customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
                });
                return;
          }
        
      
          if (!this.validaciones.validarEmail(this.registro.correo)) {
            Swal.fire({
                 width: 480,
                 html: `
                   <div class="swal-pro-error"></div>
                   <h2 class="swal-pro-title">Correo no válido</h2>
                   <p class="swal-pro-desc">El correo electrónico no es válido.</p>
                 `,
                 showConfirmButton: true,
                 confirmButtonText: 'Listo',
                 buttonsStyling: false,
                 focusConfirm: true,
                 customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
               });
               return;
          }
        
          if (!this.validaciones.validarTelefono(this.registro.telefono)) {
            Swal.fire({
                  width: 480,
                  html: `
                    <div class="swal-pro-error"></div>
                    <h2 class="swal-pro-title">Teléfono no válido</h2>
                    <p class="swal-pro-desc">El número debe tener 10 dígitos y comenzar con 0.</p>
                  `,
                  showConfirmButton: true,
                  confirmButtonText: 'Listo',
                  buttonsStyling: false,
                  focusConfirm: true,
                  customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
                });
                return;
          }
        
          // Lógica de verificación y envío
          this.serviceRegistro.verificarCedula(this.registro.ci).subscribe((resp) => {
            if (resp.existe) {
               Swal.fire({
                      width: 480,
                      html: `
                        <div class="swal-pro-warn"></div>
                        <h2 class="swal-pro-title">Cédula duplicada</h2>
                        <p class="swal-pro-desc">La cédula ingresada ya se encuentra registrada.</p>
                      `,
                      showConfirmButton: true,
                      confirmButtonText: 'Listo',
                      buttonsStyling: false,
                      focusConfirm: true,
                      customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
                    });
                    return;
            }
            this.serviceRegistro.verificarEmail(this.registro.correo).subscribe((resp) => {
              if (resp.existe) {
                Swal.fire({
                          width: 480,
                          html: `
                            <div class="swal-pro-warn"></div>
                            <h2 class="swal-pro-title">Correo duplicado</h2>
                            <p class="swal-pro-desc">El correo ingresado ya se encuentra registrado.</p>
                          `,
                          showConfirmButton: true,
                          confirmButtonText: 'Listo',
                          buttonsStyling: false,
                          focusConfirm: true,
                          customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
                        });
                        return;
              }
              this.serviceRegistro.verificarTelefono(this.registro.telefono).subscribe((resp) => {
                if (resp.existe) {
                  Swal.fire({
                              width: 480,
                              html: `
                                <div class="swal-pro-warn"></div>
                                <h2 class="swal-pro-title">Teléfono duplicado</h2>
                                <p class="swal-pro-desc">El teléfono ingresado ya se encuentra registrado.</p>
                              `,
                              showConfirmButton: true,
                              confirmButtonText: 'Listo',
                              buttonsStyling: false,
                              focusConfirm: true,
                              customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
                            });
                            return;
                }
        
                // Si todo es válido, agregar el administrador
                this.serviceRegistro.agregar(this.registro).subscribe({
                  next: (response) => {
                   Swal.fire({
                                 width: 480,
                                 html: `
                                   <div class="swal-pro-check"></div>
                                   <h2 class="swal-pro-title">Usuario agregado</h2>
                                   <p class="swal-pro-desc">Su registro ha sido exitoso.</p>
                                 `,
                                 showConfirmButton: true,
                                 confirmButtonText: 'Listo',
                                 buttonsStyling: false,
                                 focusConfirm: true,
                                 customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
                               }).then(() => {
                      
                      this._router.navigate(['/login'])
                      this.registroRef?.close();
                      
                      
                    });
                  },
                  error: (err) => {
                    console.error('Error en enviar datos del registro:', err);
                    Swal.fire({
                                  width: 480,
                                  html: `
                                    <div class="swal-pro-error"></div>
                                    <h2 class="swal-pro-title">Error</h2>
                                    <p class="swal-pro-desc">Ocurrió un error al agregar el usuario</p>
                                  `,
                                  showConfirmButton: true,
                                  confirmButtonText: 'Listo',
                                  buttonsStyling: false,
                                  focusConfirm: true,
                                  customClass: { popup:'swal-pro', confirmButton:'swal-pro-confirm', htmlContainer:'swal-pro-html' }
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
  this.isLoadingRecuperar = true;
  this.recuperarService.solicitarRecuperacion({ correo: this.correoRecuperar })
    .pipe(finalize(() => this.isLoadingRecuperar = false))
    .subscribe({
      next: () => Swal.fire({
                        width: 480,
                        html: `
                               <div class="swal-pro-check"></div>
                               <h2 class="swal-pro-title">Mensaje enviado</h2>
                                <p class="swal-pro-desc">Revisa el link en tu correo personal para reestablecer tu contraseña</p>`,
                       showConfirmButton: true,
                       confirmButtonText: 'Listo',
                       buttonsStyling: false,
                       customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' }
                      }).then(() => this.closeRecuperar()),
      error: () => Swal.fire({
             width: 480,
            html: `
              <div class="swal-pro-error"></div>
              <h2 class="swal-pro-title">Error al enviar mensaje</h2>
              <p class="swal-pro-desc">No se pudo enviar el mensaje. Intentalo nuevamente.</p>
            `,
            showConfirmButton: true,
            confirmButtonText: 'Entendido',
            buttonsStyling: false,
            customClass: { popup: 'swal-pro', confirmButton: 'swal-pro-confirm', htmlContainer: 'swal-pro-html' } })
      }
    )};
}

  

