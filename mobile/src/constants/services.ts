export type ServiceId =
  | 'walk'
  | 'sitter'
  | 'boarding'
  | 'daycare'
  | 'grooming'
  | 'training'
  | 'marketplace';

export type ServiceDefinition = {
  id: ServiceId;
  name: string;
  shortName: string;
  icon: string;
  description: string;
};

export type BookableServiceId = 'walk' | 'sitter' | 'boarding' | 'daycare';

export const bookableServiceIds: BookableServiceId[] = ['walk', 'sitter', 'boarding', 'daycare'];

export const serviceCopy: Record<BookableServiceId, {
  label: string;
  title: string;
  homeSubtitle: string;
  providersTitle: string;
  searchButton: string;
  planBasic: string;
  planFrequent: string;
  duration: string;
  schedule: {
    date: string;
    time: string;
    duration: string;
    location: string;
  };
}> = {
  walk: {
    label: 'Paseo',
    title: 'Paseo',
    homeSubtitle: 'Encuentra paseadores cerca de ti',
    providersTitle: 'Elige tu paseador',
    searchButton: 'Buscar paseadores',
    planBasic: 'Plan básico · 1 paseo',
    planFrequent: 'Plan frecuente · 3 paseos',
    duration: '60 minutos',
    schedule: {
      date: '12 de julio de 2026',
      time: '17:30',
      duration: '60 minutos',
      location: 'La Carolina, Quito',
    },
  },
  sitter: {
    label: 'Niñera',
    title: 'Niñera a domicilio',
    homeSubtitle: 'Encuentra niñeras cerca de ti',
    providersTitle: 'Elige tu niñera',
    searchButton: 'Buscar niñeras',
    planBasic: 'Cuidado puntual · 2 horas',
    planFrequent: 'Cuidado extendido · 4 horas',
    duration: '2 horas',
    schedule: {
      date: '12 de julio de 2026',
      time: '14:00',
      duration: '2 horas',
      location: 'La Carolina, Quito',
    },
  },
  boarding: {
    label: 'Hospedaje',
    title: 'Hospedaje',
    homeSubtitle: 'Encuentra hospedajes cerca de ti',
    providersTitle: 'Elige hospedaje',
    searchButton: 'Buscar hospedajes',
    planBasic: '1 noche de hospedaje',
    planFrequent: '3 noches con ahorro',
    duration: '1 noche',
    schedule: {
      date: '12 al 13 de julio de 2026',
      time: 'Entrega 09:00',
      duration: '1 noche',
      location: 'La Carolina, Quito',
    },
  },
  daycare: {
    label: 'Guardería',
    title: 'Guardería',
    homeSubtitle: 'Encuentra guarderías cerca de ti',
    providersTitle: 'Elige guardería',
    searchButton: 'Buscar guarderías',
    planBasic: 'Día de guardería · 8 horas',
    planFrequent: '3 días con ahorro',
    duration: '8 horas',
    schedule: {
      date: '12 de julio de 2026',
      time: '08:00 a 16:00',
      duration: '8 horas',
      location: 'La Carolina, Quito',
    },
  },
};

export function isBookableServiceId(serviceId?: string): serviceId is BookableServiceId {
  return bookableServiceIds.includes(serviceId as BookableServiceId);
}

export const services: ServiceDefinition[] = [
  {
    id: 'walk',
    name: 'Paseo',
    shortName: 'Paseo',
    icon: 'paw-outline',
    description: 'Paseos seguros según la rutina de tu mascota.',
  },
  {
    id: 'sitter',
    name: 'Niñera a domicilio',
    shortName: 'Niñera',
    icon: 'home-outline',
    description: 'Cuidado personalizado sin salir de casa.',
  },
  {
    id: 'boarding',
    name: 'Hospedaje',
    shortName: 'Hospedaje',
    icon: 'moon-outline',
    description: 'Una estadía cómoda con proveedores verificados.',
  },
  {
    id: 'daycare',
    name: 'Hogar guardería',
    shortName: 'Guardería',
    icon: 'sunny-outline',
    description: 'Compañía y actividades durante el día.',
  },
  {
    id: 'grooming',
    name: 'Peluquería / Grooming',
    shortName: 'Grooming',
    icon: 'cut-outline',
    description: 'Baño, corte y cuidado estético con proveedores Hupi.',
  },
  {
    id: 'training',
    name: 'Adiestramiento',
    shortName: 'Adiestra',
    icon: 'school-outline',
    description: 'Sesiones para mejorar hábitos y convivencia.',
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    shortName: 'Tienda',
    icon: 'bag-handle-outline',
    description: 'Productos seleccionados para su bienestar.',
  },
];
