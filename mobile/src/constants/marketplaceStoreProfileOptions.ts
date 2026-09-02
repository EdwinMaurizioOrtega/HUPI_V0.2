import type { ProviderStoreScheduleDay } from './marketplaceStoreState';

export const mockStoreCategories = [
  'Petshop',
  'Snacks',
  'Alimentos',
  'Veterinaria',
  'Farmacia veterinaria',
  'Accesorios',
  'Juguetes',
  'Higiene y limpieza',
  'Ropa y estilo',
  'Transporte para mascotas',
  'Productos naturales',
  'Suplementos',
  'Arena / baño para mascotas',
  'Otros',
];

export const marketplaceStoreCategories = mockStoreCategories;

export const ecuadorProvinceCities: Record<string, string[]> = {
  Pichincha: ['Quito', 'Cayambe', 'Rumiñahui', 'Mejía'],
  Guayas: ['Guayaquil', 'Samborondón', 'Durán'],
  Azuay: ['Cuenca', 'Gualaceo', 'Paute'],
  Manabí: ['Manta', 'Portoviejo', 'Chone'],
  Tungurahua: ['Ambato', 'Baños', 'Pelileo'],
  Imbabura: ['Ibarra', 'Otavalo', 'Cotacachi'],
  Loja: ['Loja', 'Catamayo', 'Macará'],
  'El Oro': ['Machala', 'Pasaje', 'Santa Rosa'],
  'Santo Domingo de los Tsáchilas': ['Santo Domingo', 'La Concordia'],
  'Los Ríos': ['Babahoyo', 'Quevedo', 'Ventanas'],
  Cotopaxi: ['Latacunga', 'Salcedo', 'Pujilí'],
  Chimborazo: ['Riobamba', 'Guano', 'Alausí'],
  Esmeraldas: ['Esmeraldas', 'Atacames', 'Quinindé'],
  'Santa Elena': ['Santa Elena', 'La Libertad', 'Salinas'],
  Carchi: ['Tulcán', 'Montúfar', 'Espejo'],
  Pastaza: ['Puyo', 'Mera', 'Santa Clara'],
  Napo: ['Tena', 'Archidona', 'El Chaco'],
  Orellana: ['Francisco de Orellana', 'Loreto', 'La Joya de los Sachas'],
  Sucumbíos: ['Nueva Loja', 'Shushufindi', 'Cascales'],
  'Zamora Chinchipe': ['Zamora', 'Yantzaza', 'Centinela del Cóndor'],
  'Morona Santiago': ['Macas', 'Sucúa', 'Gualaquiza'],
  Bolívar: ['Guaranda', 'Chillanes', 'San Miguel'],
  Cañar: ['Azogues', 'Biblián', 'La Troncal'],
  Galápagos: ['Puerto Ayora', 'Puerto Baquerizo Moreno', 'Puerto Villamil'],
};

export const countryDialCodes = [
  { country: 'Ecuador', code: '+593' },
  { country: 'Colombia', code: '+57' },
  { country: 'Perú', code: '+51' },
  { country: 'Estados Unidos', code: '+1' },
];

export const hourOptions = [
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
];

export const defaultStoreSchedule: ProviderStoreScheduleDay[] = [
  { day: 'Lunes', enabled: true, opensAt: '09:00', closesAt: '18:00' },
  { day: 'Martes', enabled: true, opensAt: '09:00', closesAt: '18:00' },
  { day: 'Miércoles', enabled: true, opensAt: '09:00', closesAt: '18:00' },
  { day: 'Jueves', enabled: true, opensAt: '09:00', closesAt: '18:00' },
  { day: 'Viernes', enabled: true, opensAt: '09:00', closesAt: '18:00' },
  { day: 'Sábado', enabled: true, opensAt: '10:00', closesAt: '16:00' },
  { day: 'Domingo', enabled: false, opensAt: '09:00', closesAt: '13:00' },
];
