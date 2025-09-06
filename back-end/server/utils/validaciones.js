export const validarCedulaEcuador = (cedula) => {
    if (cedula.length !== 10) {
      return false;
    }
  
    const digito_region = cedula.substring(0, 2);
    if (digito_region < 1 || digito_region > 24) {
      return false;
    }
  
    const ultimo_digito = parseInt(cedula.substring(9, 10));
    const pares = [1, 3, 5, 7].reduce((acc, cur) => acc + parseInt(cedula.substring(cur, cur + 1)), 0);
    const impares = [0, 2, 4, 6, 8].reduce((acc, cur) => {
      let num = parseInt(cedula.substring(cur, cur + 1)) * 2;
      if (num > 9) num -= 9;
      return acc + num;
    }, 0);
  
    const suma_total = pares + impares;
    const primer_digito_suma = parseInt(String(suma_total).substring(0, 1));
    const decena = (primer_digito_suma + 1) * 10;
    const digito_validador = decena - suma_total;
  
    return digito_validador === ultimo_digito || (digito_validador === 10 && ultimo_digito === 0);
  };

// ➕ NUEVO: valida RUC Ecuador
export const validarRucEcuador = (ruc) => {
  if (!/^\d{13}$/.test(ruc)) return false;

  const region = parseInt(ruc.slice(0, 2), 10);
  if (region < 1 || region > 24) return false;

  const tercero = parseInt(ruc[2], 10);

  // Personas naturales: 0-5 → cédula válida + final "001"
  if (tercero >= 0 && tercero <= 5) {
    if (!validarCedulaEcuador(ruc.slice(0, 10))) return false;
    return ruc.slice(10) === '001';
  }

  // Sector público: 6 → coef [3,2,7,6,5,4,3,2], DV en pos 9, final "0001"
  if (tercero === 6) {
    const coef = [3,2,7,6,5,4,3,2];
    let suma = 0;
    for (let i = 0; i < 8; i++) suma += parseInt(ruc[i], 10) * coef[i];
    const mod = suma % 11;
    const dv = (mod === 0) ? 0 : 11 - mod;
    if (dv !== parseInt(ruc[8], 10)) return false;
    return ruc.slice(9) === '0001';
  }

  // Privadas / extranjeras: 9 → coef [4,3,2,7,6,5,4,3,2], DV en pos 10, final "001"
  if (tercero === 9) {
    const coef = [4,3,2,7,6,5,4,3,2];
    let suma = 0;
    for (let i = 0; i < 9; i++) suma += parseInt(ruc[i], 10) * coef[i];
    const mod = suma % 11;
    const dv = (mod === 0) ? 0 : 11 - mod;
    if (dv !== parseInt(ruc[9], 10)) return false;
    return ruc.slice(10) === '001';
  }

  return false;
};


export const validarIdentificacionEcuador = (valor) => {
  if (!/^\d+$/.test(valor)) return false;
  if (valor.length === 10) return validarCedulaEcuador(valor);
  if (valor.length === 13) return validarRucEcuador(valor);
  return false;
};

  export const validarEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  export const validarTelefono = (telefono) => {
    return /^0\d{9}$/.test(telefono); // Asegura que el teléfono tenga 10 dígitos y comience con 0
  };