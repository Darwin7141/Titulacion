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

  export const validarEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  export const validarTelefono = (telefono) => {
    return /^0\d{9}$/.test(telefono); // Asegura que el teléfono tenga 10 dígitos y comience con 0
  };