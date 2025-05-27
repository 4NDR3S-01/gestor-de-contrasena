import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { crearContrasena } from "../../services/apiContrasenas";
import { toast } from "react-hot-toast";

export default function NuevaContrasena() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    try {
      await crearContrasena(data);
      toast.success("Contraseña guardada correctamente");
      navigate("/contrasenas");
    } catch (error) {
      toast.error("Error al guardar la contraseña");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Nueva Contraseña</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <input {...register("nombre")} placeholder="Nombre del servicio" required className="border p-2 rounded" />
        <input {...register("usuario")} placeholder="Usuario o correo" required className="border p-2 rounded" />
        <input {...register("contrasena")} type="password" placeholder="Contraseña" required className="border p-2 rounded" />
        <input {...register("categoria")} placeholder="Categoría (opcional)" className="border p-2 rounded" />
        <textarea {...register("notas")} placeholder="Notas (opcional)" className="border p-2 rounded" />
        <label className="flex items-center space-x-2">
          <input type="checkbox" {...register("favorito")} />
          <span>Marcar como favorita</span>
        </label>
        <div className="flex justify-between mt-4">
          <Link to="/contrasenas" className="text-gray-600">Cancelar</Link>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Guardar</button>
        </div>
      </form>
    </div>
);