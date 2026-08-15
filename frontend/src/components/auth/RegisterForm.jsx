import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { User, Mail, Lock, BookOpen, ShieldCheck, ArrowLeft, ArrowRight, AlertCircle, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export const RegisterForm = ({ onBack }) => {
  const { login } = useAppStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    studentCode: '',
    password: '',
    campus: 'Campus El Jardín',
    acceptHabeasData: true,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.endsWith('@unab.edu.co')) {
      setError('Debes registrarte con tu correo institucional @unab.edu.co');
      return;
    }

    if (!formData.studentCode.startsWith('U') || formData.studentCode.length < 8) {
      setError('El código estudiantil debe iniciar con U (ej: U00123456)');
      return;
    }

    if (formData.password.length < 8) {
      setError('La contraseña debe contener al menos 8 caracteres');
      return;
    }

    if (!formData.acceptHabeasData) {
      setError('Debes aceptar la autorización de tratamiento de datos (Ley 1581)');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      login({
        id: 'u2',
        name: formData.name,
        email: formData.email,
        studentCode: formData.studentCode,
        role: 'passenger',
        campus: formData.campus,
        rating: 5.0,
        tripsCount: 0,
        walletBalance: 20000,
      });
    }, 700);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col justify-between h-full p-6 text-slate-900 overflow-y-auto"
    >
      <div className="space-y-5">
        {/* Boton volver */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer w-fit p-1 -ml-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        {/* Titulo */}
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Crear Cuenta</h2>
          <p className="text-xs text-slate-500">Únete a la comunidad de movilidad compartida UNAB</p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario de Registro */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Nombre Completo */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Nombre Completo</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre y Apellidos"
                className="w-full bg-white text-xs rounded-2xl pl-10 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500"
              />
            </div>
          </div>

          {/* Correo Institucional */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Correo Institucional (@unab.edu.co)</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="usuario@unab.edu.co"
                className="w-full bg-white text-xs rounded-2xl pl-10 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500"
              />
            </div>
          </div>

          {/* Codigo Estudiantil */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Código de Estudiante / Docente</label>
            <div className="relative">
              <BookOpen className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={formData.studentCode}
                onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                placeholder="U00XXXXXX"
                className="w-full bg-white text-xs rounded-2xl pl-10 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500"
              />
            </div>
          </div>

          {/* Sede Habitual */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Sede Principal</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={formData.campus}
                onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                className="w-full bg-white text-xs rounded-2xl pl-10 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500"
              >
                <option value="Campus El Jardín">Campus El Jardín (Bucaramanga)</option>
                <option value="Campus CSU Floridablanca">Campus CSU (Floridablanca)</option>
                <option value="Campus El Bosque">Campus El Bosque (Floridablanca)</option>
              </select>
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Contraseña</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 8 caracteres"
                className="w-full bg-white text-xs rounded-2xl pl-10 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-lochmara-500"
              />
            </div>
          </div>

          {/* Habeas Data Checkbox */}
          <div className="flex items-start gap-2 pt-1">
            <input
              type="checkbox"
              id="habeas"
              checked={formData.acceptHabeasData}
              onChange={(e) => setFormData({ ...formData, acceptHabeasData: e.target.checked })}
              className="mt-0.5 rounded text-lochmara-600 focus:ring-lochmara-500 cursor-pointer"
            />
            <label htmlFor="habeas" className="text-[10px] text-slate-500 leading-tight">
              Acepto los términos de servicio y la política de tratamiento de datos personales conforme a la{' '}
              <strong className="text-slate-700">Ley 1581 de 2012</strong>.
            </label>
          </div>

          {/* Boton Registrarse */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 mt-2 rounded-2xl bg-lochmara-600 hover:bg-lochmara-500 active:bg-lochmara-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-lochmara-600/25 disabled:opacity-50"
          >
            {isLoading ? <span>Registrando...</span> : <span>Completar Registro</span>}
          </button>
        </form>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-600 pt-3">
        <ShieldCheck className="w-3.5 h-3.5 text-lochmara-600" />
        <span>Validación Automática con Matrícula UNAB</span>
      </div>
    </motion.div>
  );
};
