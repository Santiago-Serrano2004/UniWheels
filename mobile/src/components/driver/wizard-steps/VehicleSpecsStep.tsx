import React from 'react';
import { View, Text, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Car, Bike, ShieldAlert } from 'lucide-react-native';
import { ColombianPlateInput } from '../ColombianPlateInput';
import { FormSelect } from '@/components/FormSelect';
import { COLORES_VEHICULOS, ANOS_VEHICULOS } from '@uniwheels/shared';

const MARCAS_FALLBACK_CARRO = [
  'Chevrolet', 'Renault', 'Mazda', 'Kia', 'Toyota', 'Nissan', 'Hyundai',
  'Ford', 'Volkswagen', 'Suzuki', 'BYD', 'Otra Marca / Personalizada'
];

const MARCAS_FALLBACK_MOTO = [
  'Yamaha', 'Bajaj', 'Honda', 'AKT', 'Suzuki', 'KTM', 'TVS',
  'Hero', 'Kawasaki', 'Victory', 'Otra Marca / Personalizada'
];

const MODELOS_FALLBACK_CARRO: Record<string, string[]> = {
  Chevrolet: ['Spark GT', 'Sail', 'Onix', 'Tracker', 'Aveo', 'Otro Modelo'],
  Renault: ['Sandero', 'Logan', 'Duster', 'Stepway', 'Kwid', 'Otro Modelo'],
  Mazda: ['Mazda 2', 'Mazda 3', 'CX-30', 'CX-5', 'Otro Modelo'],
  Kia: ['Picanto', 'Rio', 'Sportage', 'Sonet', 'Otro Modelo'],
  Toyota: ['Corolla', 'Yaris', 'Hilux', 'Fortuner', 'Otro Modelo'],
  default: ['Línea Estándar', 'Sedán', 'Hatchback', 'SUV', 'Otro Modelo'],
};

const MODELOS_FALLBACK_MOTO: Record<string, string[]> = {
  Yamaha: ['FZ 25', 'MT 03', 'Crypton', 'NMAX', 'XTZ 125', 'Otro Modelo'],
  Bajaj: ['Pulsar NS 200', 'Pulsar 150', 'Boxer CT 100', 'Dominar 400', 'Otro Modelo'],
  Honda: ['CB 125F', 'XR 150L', 'Navi', 'CB 190R', 'XRE 300', 'Otro Modelo'],
  AKT: ['NKD 125', 'CR4 125', 'TT Dual Sport 200', 'Dynamic Pro', 'Otro Modelo'],
  default: ['Línea Estándar', 'Scooter', 'Enduro', 'Touring', 'Otro Modelo'],
};

export interface VehicleSpecsStepProps {
  tipoVehiculo: 'car' | 'motorcycle';
  setTipoVehiculo: (tipo: 'car' | 'motorcycle') => void;
  placa: string;
  setPlaca: (placa: string) => void;
  marca: string;
  setMarca: (marca: string) => void;
  marcaPersonalizada: string;
  setMarcaPersonalizada: (marca: string) => void;
  marcasDisponibles?: string[];
  cargandoMarcas?: boolean;
  modelo: string;
  setModelo: (modelo: string) => void;
  modeloPersonalizado: string;
  setModeloPersonalizado: (modelo: string) => void;
  modelosDisponibles?: string[];
  cargandoModelos?: boolean;
  ano: string;
  setAno: (ano: string) => void;
  color: string;
  setColor: (color: string) => void;
  tipoPropulsion: string;
  setTipoPropulsion: (propulsion: string) => void;
  cupos: number;
  setCupos: (cupos: number) => void;
  hasExtraHelmet?: boolean;
  setHasExtraHelmet?: (has: boolean) => void;
}

export function VehicleSpecsStep({
  tipoVehiculo,
  setTipoVehiculo,
  placa,
  setPlaca,
  marca,
  setMarca,
  marcaPersonalizada,
  setMarcaPersonalizada,
  marcasDisponibles = [],
  cargandoMarcas = false,
  modelo,
  setModelo,
  modeloPersonalizado,
  setModeloPersonalizado,
  modelosDisponibles = [],
  cargandoModelos = false,
  ano,
  setAno,
  color,
  setColor,
  tipoPropulsion,
  setTipoPropulsion,
  cupos,
  setCupos,
  hasExtraHelmet = true,
  setHasExtraHelmet,
}: VehicleSpecsStepProps) {
  const marcas = marcasDisponibles.length > 0
    ? marcasDisponibles
    : (tipoVehiculo === 'car' ? MARCAS_FALLBACK_CARRO : MARCAS_FALLBACK_MOTO);

  const fallbackModelosMap = tipoVehiculo === 'car' ? MODELOS_FALLBACK_CARRO : MODELOS_FALLBACK_MOTO;
  const modelos = marcasDisponibles.length > 0
    ? modelosDisponibles
    : (modelosDisponibles.length > 0 ? modelosDisponibles : (fallbackModelosMap[marca] || fallbackModelosMap.default));

  const esMarcaPersonalizada = marca === 'Otra Marca / Personalizada' || marca === 'Otra Marca';
  const esModeloPersonalizado = (typeof modelo === 'string' && (modelo.startsWith('Otro') || modelo === 'Otro Modelo')) || (modelos.length === 0 && !cargandoModelos && !esMarcaPersonalizada);

  return (
    <View className="space-y-4">
      {/* 1. Selector de Tipo: Carro vs Moto */}
      <View className="flex-row p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <Pressable
          onPress={() => {
            setTipoVehiculo('car');
            setMarca('Chevrolet');
            setCupos(3);
          }}
          className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-2 ${
            tipoVehiculo === 'car'
              ? 'bg-lochmara-600 shadow-xs'
              : 'bg-transparent'
          }`}
        >
          <Car size={16} color={tipoVehiculo === 'car' ? '#ffffff' : '#64748b'} />
          <Text
            className={`text-xs font-bold ${
              tipoVehiculo === 'car' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Carro
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            setTipoVehiculo('motorcycle');
            setMarca('Yamaha');
            setCupos(1);
          }}
          className={`flex-1 py-2.5 rounded-xl flex-row items-center justify-center gap-2 ${
            tipoVehiculo === 'motorcycle'
              ? 'bg-amber-500 shadow-xs'
              : 'bg-transparent'
          }`}
        >
          <Bike size={16} color={tipoVehiculo === 'motorcycle' ? '#ffffff' : '#64748b'} />
          <Text
            className={`text-xs font-bold ${
              tipoVehiculo === 'motorcycle' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Moto
          </Text>
        </Pressable>
      </View>

      {/* 2. Placa Vehicular */}
      <ColombianPlateInput
        value={placa}
        onChangeText={setPlaca}
        vehicleType={tipoVehiculo}
      />

      {/* 3. Marca y Modelo */}
      <View className="flex-row gap-2.5">
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Marca</Text>
            {cargandoMarcas && <ActivityIndicator size="small" color="#0284c7" />}
          </View>
          <FormSelect
            searchable
            value={marca}
            onChange={(val) => setMarca(String(val))}
            options={marcas.map((m) => ({ value: m, label: m }))}
          />
        </View>

        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">Línea / Modelo</Text>
            {cargandoModelos && <ActivityIndicator size="small" color="#0284c7" />}
          </View>
          <FormSelect
            searchable
            value={modelo}
            onChange={(val) => setModelo(String(val))}
            options={modelos.map((mod) => ({ value: mod, label: mod }))}
          />
        </View>
      </View>

      {/* Entradas manuales si seleccionó marca/modelo personalizado */}
      {(esMarcaPersonalizada || esModeloPersonalizado) && (
        <View className="p-3.5 rounded-2xl border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 gap-2.5">
          {esMarcaPersonalizada && (
            <View className="gap-1">
              <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Escribe la marca de tu vehículo:
              </Text>
              <TextInput
                value={marcaPersonalizada}
                onChangeText={setMarcaPersonalizada}
                placeholder="Ej. BYD, Changan, Starker..."
                placeholderTextColor="#94a3b8"
                className="py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </View>
          )}

          {esModeloPersonalizado && (
            <View className="gap-1">
              <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                Escribe la línea o modelo:
              </Text>
              <TextInput
                value={modeloPersonalizado}
                onChangeText={setModeloPersonalizado}
                placeholder="Ej. Dolphin Mini, MRX 150..."
                placeholderTextColor="#94a3b8"
                className="py-2 px-3 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </View>
          )}
        </View>
      )}

      {/* 4. Año, Color y Propulsión */}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <FormSelect
            label="Año"
            value={ano}
            onChange={(val) => setAno(String(val))}
            options={ANOS_VEHICULOS.map((a) => ({ value: a, label: a }))}
          />
        </View>

        <View className="flex-1">
          <FormSelect
            label="Color"
            value={color}
            onChange={(val) => setColor(String(val))}
            options={COLORES_VEHICULOS.map((c) => ({ value: c, label: c }))}
          />
        </View>

        <View className="flex-1">
          <FormSelect
            label="Propulsión"
            value={tipoPropulsion}
            onChange={(val) => setTipoPropulsion(String(val))}
            options={[
              { value: 'gasolina', label: 'Gasolina' },
              { value: 'hibrido', label: 'Híbrido' },
              { value: 'electrico', label: 'Eléctrico' },
              { value: 'diesel', label: 'Diésel' },
            ]}
          />
        </View>
      </View>

      {/* 5. Cupos Disponibles para Compartir */}
      <View className="gap-1.5">
        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
          Cupos Disponibles para Pasajeros:
        </Text>
        <View className="flex-row gap-2">
          {(tipoVehiculo === 'motorcycle' ? [1] : [1, 2, 3, 4]).map((num) => (
            <Pressable
              key={num}
              onPress={() => setCupos(num)}
              className={`flex-1 py-2.5 rounded-2xl border items-center justify-center ${
                cupos === num
                  ? 'bg-lochmara-600 border-lochmara-600'
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <Text
                className={`text-xs font-black ${
                  cupos === num ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {num} {num === 1 ? 'Cupo' : 'Cupos'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 6. Si es moto: Requisito de Casco Reglamentario Adicional */}
      {tipoVehiculo === 'motorcycle' && (
        <Pressable
          onPress={() => setHasExtraHelmet && setHasExtraHelmet(!hasExtraHelmet)}
          className={`p-3.5 rounded-2xl border flex-row items-start gap-3 ${
            hasExtraHelmet
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
          }`}
        >
          <ShieldAlert size={18} color={hasExtraHelmet ? '#10b981' : '#f59e0b'} />
          <View className="flex-1">
            <Text
              className={`text-xs font-bold ${
                hasExtraHelmet
                  ? 'text-emerald-900 dark:text-emerald-200'
                  : 'text-amber-900 dark:text-amber-200'
              }`}
            >
              Casco Adicional Reglamentario (Resolución 23385/2020)
            </Text>
            <Text className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">
              Cuento con un casco certificado con visor para el pasajero universitario.
            </Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}
