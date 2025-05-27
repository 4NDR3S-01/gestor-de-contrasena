import clienteAxios from "./api";

export const crearContrasena = async (datos: any) => {
  const respuesta = await clienteAxios.post("/contrasenas", datos);
  return respuesta.data;
};