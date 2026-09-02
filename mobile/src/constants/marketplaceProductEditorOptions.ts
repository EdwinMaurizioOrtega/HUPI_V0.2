import type { ProductVariationKind } from './marketplaceStoreState';

export const mockProductCategories = [
  { id: 'snacks', name: 'Snacks', icon: 'fish-outline', emoji: '🦴', color: '#fff0ec' },
  { id: 'food', name: 'Alimentos', icon: 'nutrition-outline', emoji: '🥣', color: '#f9f9e2' },
  { id: 'toys', name: 'Juguetes', icon: 'tennisball-outline', emoji: '🎾', color: '#f0ebf7' },
  { id: 'accessories', name: 'Accesorios', icon: 'sparkles-outline', emoji: '🦮', color: '#f9f9e2' },
  { id: 'hygiene-cleaning', name: 'Higiene y limpieza', icon: 'water-outline', emoji: '🧴', color: '#f0ebf7' },
  { id: 'health-wellness', name: 'Salud y bienestar', icon: 'medkit-outline', emoji: '💊', color: '#fff0ec' },
  { id: 'veterinary-medicine', name: 'Medicina / veterinaria', icon: 'medical-outline', emoji: '🩺', color: '#f9f9e2' },
  { id: 'beds-rest', name: 'Camas y descanso', icon: 'bed-outline', emoji: '☁️', color: '#f0ebf7' },
  { id: 'collars-leashes', name: 'Collares y correas', icon: 'link-outline', emoji: '🦮', color: '#fff0ec' },
  { id: 'clothing-style', name: 'Ropa y estilo', icon: 'shirt-outline', emoji: '👕', color: '#f9f9e2' },
  { id: 'litter-bath', name: 'Arena / baño', icon: 'cube-outline', emoji: '🚿', color: '#f0ebf7' },
  { id: 'supplements', name: 'Suplementos', icon: 'fitness-outline', emoji: '💊', color: '#fff0ec' },
  { id: 'carriers', name: 'Transportadoras', icon: 'briefcase-outline', emoji: '🧳', color: '#f9f9e2' },
  { id: 'other', name: 'Otros', icon: 'apps-outline', emoji: '🛍️', color: '#fff0ec' },
] as const;

export const productCategoryOptions = mockProductCategories.map((category) => category.name);

export const productVariationKinds: ProductVariationKind[] = [
  'Color',
  'Talla',
  'Sabor',
  'Tamaño de empaque',
  'Personalizado',
];

export const mockProductAttributes = [
  'Color',
  'Talla',
  'Sabor',
  'Tamaño de empaque',
  'Personalizado',
] as const;

export const suggestedVariationOptions: Record<ProductVariationKind, string[]> = {
  Talla: ['XS', 'S', 'M', 'L', 'XL', 'Personalizada'],
  Color: ['Rojo', 'Azul', 'Verde', 'Negro', 'Blanco', 'Amarillo', 'Morado', 'Coral', 'Personalizado'],
  Sabor: ['Pollo', 'Pavo', 'Res', 'Salmón', 'Vegetales', 'Otro'],
  'Tamaño de empaque': ['100 g', '250 g', '500 g', '1 kg', '2 kg', 'Personalizado'],
  Personalizado: ['Cachorro', 'Adulto', 'Senior'],
};

export const mockColorSwatches: Record<string, string> = {
  Amarillo: '#f5c542',
  Azul: '#3478f6',
  Blanco: '#ffffff',
  Coral: '#e45336',
  Morado: '#614193',
  Negro: '#333333',
  Rojo: '#d64141',
  Verde: '#32966f',
  Beige: '#d8c7a3',
  Menta: '#70c1a1',
};

export const weightUnits = ['g', 'kg', 'lb'] as const;
