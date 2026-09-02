export const ECUADOR_PROVINCE_CITIES = {
  Azuay: ['Cuenca', 'Gualaceo', 'Paute', 'Chordeleg'],
  Bolívar: ['Guaranda', 'San Miguel', 'Chillanes'],
  Cañar: ['Azogues', 'Cañar', 'La Troncal'],
  Carchi: ['Tulcán', 'San Gabriel', 'El Ángel'],
  Chimborazo: ['Riobamba', 'Guano', 'Alausí'],
  Cotopaxi: ['Latacunga', 'La Maná', 'Salcedo'],
  'El Oro': ['Machala', 'Pasaje', 'Santa Rosa', 'Huaquillas'],
  Esmeraldas: ['Esmeraldas', 'Atacames', 'Quinindé', 'San Lorenzo'],
  Galápagos: ['Puerto Baquerizo Moreno', 'Puerto Ayora', 'Puerto Villamil'],
  Guayas: ['Guayaquil', 'Durán', 'Samborondón', 'Milagro', 'Daule'],
  Imbabura: ['Ibarra', 'Otavalo', 'Cotacachi', 'Atuntaqui'],
  Loja: ['Loja', 'Catamayo', 'Macará', 'Saraguro'],
  'Los Ríos': ['Babahoyo', 'Quevedo', 'Ventanas', 'Vinces'],
  Manabí: ['Portoviejo', 'Manta', 'Chone', 'Jipijapa', 'Montecristi'],
  'Morona Santiago': ['Macas', 'Sucúa', 'Gualaquiza', 'Méndez'],
  Napo: ['Tena', 'Archidona', 'El Chaco'],
  Orellana: ['Puerto Francisco de Orellana', 'La Joya de los Sachas', 'Loreto'],
  Pastaza: ['Puyo', 'Mera', 'Santa Clara'],
  Pichincha: ['Quito', 'Cayambe', 'Sangolquí', 'Machachi'],
  'Santa Elena': ['Santa Elena', 'La Libertad', 'Salinas'],
  'Santo Domingo de los Tsáchilas': ['Santo Domingo'],
  Sucumbíos: ['Nueva Loja', 'Shushufindi', 'Lumbaquí'],
  Tungurahua: ['Ambato', 'Baños de Agua Santa', 'Pelileo', 'Patate'],
  'Zamora Chinchipe': ['Zamora', 'Yantzaza', 'Zumba', 'El Pangui'],
} as const;

export type EcuadorProvince = keyof typeof ECUADOR_PROVINCE_CITIES;

export const ECUADOR_PROVINCES = Object.keys(
  ECUADOR_PROVINCE_CITIES,
) as EcuadorProvince[];

export function getEcuadorCities(province: string): readonly string[] {
  return ECUADOR_PROVINCE_CITIES[province as EcuadorProvince] ?? [];
}
