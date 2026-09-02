import { ThemedView as View } from '@/theme/ThemedView';
import { ThemedIonicons as Ionicons } from '@/theme/ThemedIonicons';
import { useLocalSearchParams,
  useRouter } from 'expo-router';
import { useState,
  type ReactNode } from 'react';
import { Modal,
  StyleSheet,
} from 'react-native';
import { useTranslation } from '../../../node_modules/react-i18next';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ProviderPageHeader } from '@/components/provider/ProviderPageHeader';
import { ScreenContainer } from '@/components/ScreenContainer';
import { formatMarketplaceCurrency } from '@/components/marketplace/ProductPriceBlock';
import { colors } from '@/constants/colors';
import { Pressable, Text, TextInput } from '@/i18n/components';
import {
  mockColorSwatches,
  mockProductAttributes,
  mockProductCategories,
  suggestedVariationOptions,
  weightUnits,
} from '@/constants/marketplaceProductEditorOptions';
import {
  addProviderStockNotification,
  currentMockMarketplaceStoreId,
  getProductCategoryName,
  getProviderProduct,
  getProviderStoreProfile,
  saveProviderProduct,
  type MarketplaceProductTag,
  type MarketplaceProductTaxRate,
  type MarketplaceProductType,
  type ProductAttributeMock,
  type ProductAttributeOptionMock,
  type ProductImageMock,
  type ProductPackageDimensions,
  type ProductPackageLogistics,
  type ProductVariationKind,
  type ProductVariationMock,
  type ProviderMarketplaceProduct,
} from '@/constants/marketplaceStoreState';

const productTags: MarketplaceProductTag[] = ['Nuevo', 'Oferta', 'Recomendado'];
const taxRateOptions = ['0%', '15%'];
const imageEmojis = ['📷', '🦴', '🐾', '📦', '✨', '🛍️'];

type SavePopupState = {
  title: string;
  message: string;
  missingFields?: string[];
  buttonLabel?: string;
  onConfirm?: () => void;
};

export default function ProviderProductEditorScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const store = getProviderStoreProfile();
  const existingProduct = getProviderProduct(productId);
  const [product, setProduct] = useState<ProviderMarketplaceProduct>(() => existingProduct ?? createEmptyProduct(store.name, store.isVerifiedByHupi, store.isOfficialStore));
  const [expandedSelect, setExpandedSelect] = useState<string | null>(null);
  const [savePopup, setSavePopup] = useState<SavePopupState | null>(null);
  const selectedCategory = getProductCategoryName(product.categoryId, product.category);
  const isSimple = product.productType === 'simple';
  const productActive = isProductActive(product);
  const simpleStockLow = isSimple && isLowStock(product.stock, product.stockAlertMin);

  const closeSavePopup = () => {
    const onConfirm = savePopup?.onConfirm;
    setSavePopup(null);
    onConfirm?.();
  };

  const updateField = <Key extends keyof ProviderMarketplaceProduct>(field: Key, value: ProviderMarketplaceProduct[Key]) => {
    setProduct((current) => ({ ...current, [field]: value, isProductSaved: false }));
  };

  const updatePackageDimensions = <Key extends keyof ProductPackageDimensions>(field: Key, value: ProductPackageDimensions[Key]) => {
    setProduct((current) => ({ ...current, isProductSaved: false, packageDimensions: { ...current.packageDimensions, [field]: value } }));
  };

  const updateProductActive = (active: boolean) => {
    setProduct((current) => ({
      ...current,
      isActive: active,
      isProductSaved: false,
      status: active ? 'Activo' : 'Pausado',
      stockStatus: active ? (current.stock > 0 ? 'Disponible' : 'Sin stock') : 'Pausado',
    }));
  };

  const selectProductType = (productType: MarketplaceProductType) => {
    setProduct((current) => {
      if (current.productType === productType) {
        return current;
      }

      return productType === 'simple'
        ? {
          ...current,
          isProductSaved: false,
          productType,
          sku: current.sku || createMockSku(current.name || 'PRODUCTO', 'SIMPLE'),
          attributes: [],
          variations: [],
          richVariations: [],
          variationCombinations: [],
          stock: current.stock || 1,
          stockStatus: current.stock > 0 ? 'Disponible' : 'Sin stock',
        }
        : {
          ...withoutGeneralSku(current),
          isProductSaved: false,
          productType,
          stock: 0,
          stockStatus: 'Disponible',
          attributes: current.attributes.length > 0 ? current.attributes : [createAttribute('Color')],
          variations: current.variations.length > 0 ? current.variations : [],
        };
    });
  };

  const selectCategory = (categoryId: string) => {
    const categoryName = getProductCategoryName(categoryId);
    setProduct((current) => ({ ...current, category: categoryName, categoryId, isProductSaved: false }));
    setExpandedSelect(null);
  };

  const toggleTag = (tag: MarketplaceProductTag) => {
    setProduct((current) => ({
      ...current,
      isProductSaved: false,
      tags: current.tags.includes(tag)
        ? current.tags.filter((item) => item !== tag)
        : [...current.tags, tag],
    }));
  };

  const attachImage = () => {
    const nextImage: ProductImageMock = {
      id: `image-${Date.now()}`,
      emoji: imageEmojis[product.images.length % imageEmojis.length],
      isPrimary: product.images.length === 0,
      label: `Imagen ${product.images.length + 1}`,
      order: product.images.length + 1,
    };
    const nextImages = normalizeImages([...product.images, nextImage], product.mainImageId || nextImage.id);
    updateField('images', nextImages);
    updateField('mainImageId', (product.mainImageId || nextImage.id) as ProviderMarketplaceProduct['mainImageId']);
  };

  const makePrimaryImage = (imageId: string) => {
    updateField('mainImageId', imageId);
    updateField('images', normalizeImages(product.images, imageId));
  };

  const removeImage = (imageId: string) => {
    const nextImages = product.images.filter((image) => image.id !== imageId);
    const nextMainImageId = product.mainImageId === imageId ? nextImages[0]?.id ?? '' : product.mainImageId;
    updateField('mainImageId', nextMainImageId);
    updateField('images', normalizeImages(nextImages, nextMainImageId));
  };

  const moveImage = (imageId: string, direction: 'up' | 'down') => {
    const sorted = [...product.images].sort((a, b) => a.order - b.order);
    const index = sorted.findIndex((image) => image.id === imageId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) {
      return;
    }

    [sorted[index], sorted[targetIndex]] = [sorted[targetIndex], sorted[index]];
    updateField('images', normalizeImages(sorted, product.mainImageId));
  };

  const toggleAttribute = (kind: ProductVariationKind) => {
    setProduct((current) => {
      const exists = current.attributes.some((attribute) => attribute.kind === kind);
      const attributes = exists
        ? current.attributes.filter((attribute) => attribute.kind !== kind)
        : [...current.attributes, createAttribute(kind)];

      return {
        ...current,
        isProductSaved: false,
        attributes,
        variations: current.variations.filter((variation) => variationUsesExistingOptions(variation, attributes)).map(markVariationUnsaved),
      };
    });
  };

  const updateAttributeName = (attributeId: string, name: string) => {
    setProduct((current) => ({
      ...current,
      isProductSaved: false,
      attributes: current.attributes.map((attribute) => (attribute.id === attributeId ? { ...attribute, name } : attribute)),
    }));
  };

  const addAttributeOption = (attributeId: string) => {
    setProduct((current) => ({
      ...current,
      isProductSaved: false,
      attributes: current.attributes.map((attribute) => (
        attribute.id === attributeId
          ? {
            ...attribute,
            options: [...attribute.options, createAttributeOption(attribute.kind, attribute.kind === 'Color' ? 'Coral' : 'Nueva opción')],
          }
          : attribute
      )),
    }));
  };

  const updateAttributeOption = (attributeId: string, optionId: string, updates: Partial<ProductAttributeOptionMock>) => {
    setProduct((current) => ({
      ...current,
      isProductSaved: false,
      attributes: current.attributes.map((attribute) => (
        attribute.id === attributeId
          ? {
            ...attribute,
            options: attribute.options.map((option) => (
              option.id === optionId
                ? {
                  ...option,
                  ...updates,
                  colorHex: attribute.kind === 'Color' ? updates.colorHex ?? mockColorSwatches[updates.name ?? option.name] ?? option.colorHex : undefined,
                }
                : option
            )),
          }
          : attribute
      )),
    }));
  };

  const removeAttributeOption = (attributeId: string, optionId: string) => {
    setProduct((current) => {
      const attributes = current.attributes.map((attribute) => (
        attribute.id === attributeId
          ? { ...attribute, options: attribute.options.filter((option) => option.id !== optionId) }
          : attribute
      ));

      return {
        ...current,
        isProductSaved: false,
        attributes,
        variations: current.variations.filter((variation) => variationUsesExistingOptions(variation, attributes)).map(markVariationUnsaved),
      };
    });
  };

  const addVariation = () => {
    if (product.attributes.length === 0 || product.attributes.some((attribute) => attribute.options.length === 0)) {
      return;
    }

    const selectedOptions = Object.fromEntries(product.attributes.map((attribute) => [attribute.id, attribute.options[0].id]));
    const nextVariation = createVariation(product.attributes, selectedOptions, product.variations.length + 1);
    updateField('variations', [...product.variations, nextVariation]);
  };

  const updateVariation = (variationId: string, updates: Partial<ProductVariationMock>) => {
    setProduct((current) => ({
      ...current,
      isProductSaved: false,
      variations: current.variations.map((variation) => (
        variation.id === variationId
          ? markVariationUnsaved(normalizeVariation({ ...variation, ...updates }))
          : variation
      )),
    }));
  };

  const updateVariationActive = (variationId: string, active: boolean) => {
    updateVariation(variationId, { isActive: active, status: active ? 'Activa' : 'Pausada' });
  };

  const updateVariationOption = (variationId: string, attributeId: string, optionId: string) => {
    setProduct((current) => ({
      ...current,
      isProductSaved: false,
      variations: current.variations.map((variation) => (
        variation.id === variationId
          ? markVariationUnsaved(normalizeVariationName({
            ...variation,
            selectedOptions: { ...variation.selectedOptions, [attributeId]: optionId },
          }, current.attributes))
          : variation
      )),
    }));
  };

  const updateVariationDimensions = (variationId: string, updates: Partial<ProductPackageDimensions>) => {
    setProduct((current) => ({
      ...current,
      isProductSaved: false,
      variations: current.variations.map((variation) => (
        variation.id === variationId
          ? markVariationUnsaved({ ...variation, packageDimensions: { ...variation.packageDimensions, ...updates } })
          : variation
      )),
    }));
  };

  const removeVariation = (variationId: string) => {
    updateField('variations', product.variations.filter((variation) => variation.id !== variationId));
  };

  const saveVariation = (variationId: string) => {
    const variation = product.variations.find((item) => item.id === variationId);

    if (!variation) {
      return;
    }

    const missingFields = getVariationMissingFields(variation, product.attributes);

    if (missingFields.length > 0) {
      setSavePopup({
        title: 'Faltan datos obligatorios',
        message: 'Completa los siguientes campos para guardar el producto:',
        missingFields,
      });
      return;
    }

    setProduct((current) => ({
      ...current,
      isProductSaved: false,
      variations: current.variations.map((variation) => (
        variation.id === variationId ? { ...variation, isSaved: true } : variation
      )),
    }));
    notifyLowStockVariation(product.name, variation);
    setSavePopup({
      title: 'Variación guardada',
      message: 'La variación se guardó correctamente.',
    });
  };

  const save = (draft = false) => {
    if (!draft) {
      const missingGlobalFields = getGlobalMissingFields(product);
      const missingProductFields = isSimple ? getSimpleMissingFields(product) : getVariableMissingFields(product);
      const missingFields = [...missingGlobalFields, ...missingProductFields];

      if (!isSimple && product.variations.length === 0) {
        setSavePopup({
          title: 'Falta una variación',
          message: 'Para guardar un producto variable, debes crear al menos una variación con sus atributos, precios, stock y medidas.',
        });
        return;
      }

      if (missingFields.length > 0) {
        setSavePopup({
          title: 'Faltan datos obligatorios',
          message: 'Completa los siguientes campos para guardar el producto:',
          missingFields,
        });
        return;
      }
    }

    if (!isSimple && product.variations.length === 0) {
      setSavePopup({
        title: 'Falta una variación',
        message: 'Para guardar un producto variable, debes crear al menos una variación con sus atributos, precios, stock y medidas.',
      });
      return;
    }

    const categoryName = getProductCategoryName(product.categoryId, product.category);
    const baseVariation = product.variations.find((variation) => isVariationActive(variation) && variation.stock > 0) ?? product.variations[0];
    const cardPriceAfter = isSimple ? Number(product.cardPriceAfter || 0) : Number(baseVariation?.priceAfterCard ?? 0);
    const transferPriceAfter = isSimple ? Number(product.transferPriceAfter || 0) : Number(baseVariation?.priceAfterTransfer ?? 0);
    const savedVariations = isSimple ? product.variations : product.variations.map((variation) => ({
      ...variation,
      isSaved: true,
      isActive: isVariationActive(variation),
      status: isVariationActive(variation) ? 'Activa' as const : 'Pausada' as const,
    }));
    const variableHasAvailableVariation = savedVariations.some((variation) => isVariationActive(variation) && variation.stock > 0);

    const normalized = saveProviderProduct({
      ...(isSimple ? product : withoutGeneralSku(product)),
      cardPrice: cardPriceAfter,
      cardPriceAfter,
      category: categoryName,
      discount: isSimple
        ? calculateDiscount(product.cardPriceBefore, cardPriceAfter)
        : product.variations.reduce((best, variation) => Math.max(best, calculateDiscount(variation.priceBeforeCard, variation.priceAfterCard)), 0),
      legacyVariations: buildLegacyVariations(product.attributes),
      priceBefore: isSimple ? product.cardPriceBefore : baseVariation?.priceBeforeCard,
      stock: isSimple ? Number(product.stock || 0) : savedVariations.reduce((total, variation) => total + (isVariationActive(variation) ? variation.stock : 0), 0),
      stockStatus: isSimple && product.stock <= 0 ? 'Sin stock' : product.stockStatus,
      status: draft ? 'Pausado' : isSimple ? (productActive ? 'Activo' : 'Pausado') : (variableHasAvailableVariation ? 'Activo' : 'Pausado'),
      isActive: isSimple ? productActive : undefined,
      transferPrice: transferPriceAfter,
      transferPriceAfter,
      variations: savedVariations,
      isProductSaved: true,
      isDraft: draft,
      ...(isSimple ? { sku: product.sku?.trim() } : {}),
    });
    setProduct(normalized);
    notifyLowStockProduct(normalized);
    setSavePopup(draft
      ? {
        title: 'Borrador guardado',
        message: 'El producto se guardó como borrador.',
      }
      : {
        title: 'Producto guardado',
        message: isSimple
          ? 'El producto se guardó correctamente.'
          : 'El producto y todas sus variaciones se guardaron correctamente.',
      });
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ProviderPageHeader
        onBack={() => router.back()}
        subtitle="__hupi_i18n:provider.product-editor.ecommerceConfiguration"
        title={existingProduct ? 'Editar producto' : 'Agregar producto'}
      />

      <SaveFeedbackModal popup={savePopup} onClose={closeSavePopup} />

      <Section title="__hupi_i18n:common.productType" icon="swap-horizontal-outline">
        <ChipGroup
          label="__hupi_i18n:common.productType"
          onSelect={(value) => selectProductType(value === 'Producto simple' ? 'simple' : 'variable')}
          options={['Producto simple', 'Producto variable']}
          selected={[isSimple ? 'Producto simple' : 'Producto variable']}
        />
      </Section>

      <Section title="__hupi_i18n:provider.product-editor.basicInformation" icon="cube-outline">
        <MockInput label="__hupi_i18n:provider.product-editor.productName" onChangeText={(value) => updateField('name', value)} value={product.name} />
        <MockInput label="__hupi_i18n:provider.product-editor.productBrand" onChangeText={(value) => updateField('brand', value)} value={product.brand} />
        <MockInput label="__hupi_i18n:common.description" multiline onChangeText={(value) => updateField('description', value)} value={product.description} />
        <ChipGroup
          label="__hupi_i18n:provider.product-editor.productTax"
          onSelect={(value) => updateField('taxRate', Number(value.replace('%', '')) as MarketplaceProductTaxRate)}
          options={taxRateOptions}
          selected={[`${product.taxRate ?? 0}%`]}
        />
        <Text style={styles.helpText}>__hupi_i18n:provider.product-editor.thisTaxWillBeAppliedToTheProductAccording</Text>
        {isSimple ? (
          <SwitchControl
            active={productActive}
            label="__hupi_i18n:provider.product-editor.turnYourProductOnOrOff"
            offText="No visible en marketplace"
            onText="Visible en marketplace"
            onToggle={() => updateProductActive(!productActive)}
          />
        ) : null}
        <TagSelector selected={product.tags} toggleTag={toggleTag} />
      </Section>

      <Section title="__hupi_i18n:common.category" icon="albums-outline">
        <Dropdown
          expanded={expandedSelect === 'category'}
          label="__hupi_i18n:provider.product-editor.productCategory"
          onSelect={selectCategory}
          onToggle={() => setExpandedSelect((current) => (current === 'category' ? null : 'category'))}
          options={mockProductCategories.map((category) => ({ label: category.name, value: category.id }))}
          value={selectedCategory}
        />
      </Section>

      <Section title="__hupi_i18n:provider.product-editor.productImages" icon="images-outline">
        <Text style={styles.helpText}>__hupi_i18n:provider.product-editor.loadImagesAndThenDefineWhichOneWillBe</Text>
        <Button icon="cloud-upload-outline" onPress={attachImage} title="__hupi_i18n:common.uploadImages" variant="secondary" />
        {product.images.length > 0 ? (
          <View style={styles.mainImageBox}>
            <Text style={styles.mainImageEmoji}>{product.images.find((image) => image.id === product.mainImageId)?.emoji ?? product.images[0]?.emoji ?? product.emoji}</Text>
            <Text style={styles.mainImageLabel}>__hupi_i18n:common.mainImage</Text>
          </View>
        ) : null}
        <View style={styles.thumbnailGrid}>
          {[...product.images].sort((a, b) => a.order - b.order).map((image) => (
            <View key={image.id} style={[styles.thumbnailCard, image.id === product.mainImageId && styles.thumbnailPrimary]}>
              <View style={styles.thumbnailTop}>
                <Text style={styles.thumbnailEmoji}>{image.emoji}</Text>
                <View style={styles.thumbnailCopy}>
                  <Text numberOfLines={1} style={styles.thumbnailText}>{image.label}</Text>
                  <Text style={styles.thumbnailMeta}>{t('providerProducts.imageOrder', { kind: image.id === product.mainImageId ? t('providerProducts.mainImage') : t('providerProducts.secondaryImage'), order: image.order })}</Text>
                </View>
              </View>
              <View style={styles.thumbnailActions}>
                <MiniButton disabled={image.id === product.mainImageId} label="__hupi_i18n:common.main" onPress={() => makePrimaryImage(image.id)} />
                <MiniButton label="__hupi_i18n:common.upload" onPress={() => moveImage(image.id, 'up')} />
                <MiniButton label="__hupi_i18n:common.download" onPress={() => moveImage(image.id, 'down')} />
                <MiniButton label="__hupi_i18n:common.delete" onPress={() => removeImage(image.id)} />
              </View>
            </View>
          ))}
        </View>
      </Section>

      {isSimple ? (
        <Section title="__hupi_i18n:provider.product-editor.generalProductSettings" icon="settings-outline">
          <MockInput label="__hupi_i18n:common.sku2" onChangeText={(value) => updateField('sku', value)} value={product.sku ?? ''} />
          <View style={styles.twoColumns}>
            <MockInput keyboardType="decimal-pad" label="__hupi_i18n:provider.product-editor.priceBeforeCard" onChangeText={(value) => updateField('cardPriceBefore', Number(value || 0))} value={`${product.cardPriceBefore ?? ''}`} />
            <MockInput keyboardType="decimal-pad" label="__hupi_i18n:provider.product-editor.currentCardPrice" onChangeText={(value) => updateField('cardPriceAfter', Number(value || 0))} value={`${product.cardPriceAfter}`} />
          </View>
          <PricePreview after={product.cardPriceAfter} before={product.cardPriceBefore} label="__hupi_i18n:common.card2" />
          <View style={styles.twoColumns}>
            <MockInput keyboardType="decimal-pad" label="__hupi_i18n:provider.product-editor.priceBeforeTransfer" onChangeText={(value) => updateField('transferPriceBefore', Number(value || 0))} value={`${product.transferPriceBefore ?? ''}`} />
            <MockInput keyboardType="decimal-pad" label="__hupi_i18n:provider.product-editor.currentTransferPrice" onChangeText={(value) => updateField('transferPriceAfter', Number(value || 0))} value={`${product.transferPriceAfter}`} />
          </View>
          <PricePreview after={product.transferPriceAfter} before={product.transferPriceBefore} label="__hupi_i18n:provider.product-editor.transferDeuna" />
          <View style={styles.twoColumns}>
            <MockInput keyboardType="number-pad" label="__hupi_i18n:common.stockAvailable" onChangeText={(value) => updateField('stock', Number(value || 0))} value={`${product.stock}`} />
            <MockInput keyboardType="number-pad" label="__hupi_i18n:provider.product-editor.minimumAlertStock" onChangeText={(value) => updateField('stockAlertMin', Number(value || 0))} value={`${product.stockAlertMin}`} />
          </View>
          {simpleStockLow ? <LowStockAlert /> : null}
          <PackageDimensionsEditor dimensions={product.packageDimensions} onUpdate={updatePackageDimensions} />
        </Section>
      ) : (
        <>
          <Section title="__hupi_i18n:common.attributes" icon="options-outline">
            <Text style={styles.helpText}>__hupi_i18n:provider.product-editor.definesOnlyAttributesAndOptionsThePriceStockDiscount</Text>
            <ChipGroup
              label="__hupi_i18n:provider.product-editor.availableAttributes"
              multiple
              onSelect={(value) => toggleAttribute(value as ProductVariationKind)}
              options={[...mockProductAttributes]}
              selected={product.attributes.map((attribute) => attribute.kind)}
            />
            {product.attributes.map((attribute) => (
              <AttributeEditor
                attribute={attribute}
                key={attribute.id}
                onAddOption={() => addAttributeOption(attribute.id)}
                onRemoveOption={(optionId) => removeAttributeOption(attribute.id, optionId)}
                onUpdateName={(name) => updateAttributeName(attribute.id, name)}
                onUpdateOption={(optionId, updates) => updateAttributeOption(attribute.id, optionId, updates)}
              />
            ))}
          </Section>

          <Section title="__hupi_i18n:common.variations" icon="git-branch-outline">
            <Text style={styles.helpText}>__hupi_i18n:provider.product-editor.createCombinationsUsingPreviouslyConfiguredOptionsAndCompleteYour</Text>
            <Button disabled={product.attributes.length === 0} icon="add-circle-outline" onPress={addVariation} title="__hupi_i18n:provider.product-editor.addVariation" variant="outline" />
            {product.attributes.length === 0 ? (
              <Text style={styles.emptyText}>__hupi_i18n:provider.product-editor.configureAtLeastOneAttributeToCreateVariations</Text>
            ) : null}
            {product.variations.map((variation) => (
              <VariationCard
                attributes={product.attributes}
                key={variation.id}
                onRemove={() => removeVariation(variation.id)}
                onSave={() => saveVariation(variation.id)}
                onToggleActive={() => updateVariationActive(variation.id, !isVariationActive(variation))}
                onUpdate={(updates) => updateVariation(variation.id, updates)}
                onUpdateDimensions={(updates) => updateVariationDimensions(variation.id, updates)}
                onUpdateOption={(attributeId, optionId) => updateVariationOption(variation.id, attributeId, optionId)}
                variation={variation}
              />
            ))}
          </Section>
        </>
      )}

      <View style={styles.actions}>
        <Button icon="save-outline" onPress={() => save(false)} title="__hupi_i18n:common.saveProduct" />
        <Button icon="document-outline" onPress={() => save(true)} title="__hupi_i18n:provider.product-editor.saveAsDraft" variant="secondary" />
        <Button icon="close-outline" onPress={() => router.back()} title="__hupi_i18n:common.cancel" variant="outline" />
      </View>
    </ScreenContainer>
  );
}

function createEmptyProduct(storeName: string, isVerifiedByHupi: boolean, isOfficialStore: boolean): ProviderMarketplaceProduct {
  const images = createDefaultImages('🐾', 'Producto nuevo');
  const packageDimensions = createDefaultPackageDimensions();
  const logistics: ProductPackageLogistics = {
    ...packageDimensions,
    pickupAddress: '',
    shippingMethod: '',
  };

  return {
    id: `provider-product-${Date.now()}`,
    name: '',
    brand: storeName,
    storeId: currentMockMarketplaceStoreId,
    storeName,
    isVerifiedByHupi,
    isOfficialStore,
    productType: 'simple',
    sku: createMockSku('PRODUCTO', 'SIMPLE'),
    isActive: false,
    isProductSaved: false,
    isDraft: false,
    categoryId: 'snacks',
    category: 'Snacks',
    categoryOther: '',
    price: '$0.00',
    priceBefore: undefined,
    cardPriceBefore: undefined,
    cardPrice: 0,
    cardPriceAfter: 0,
    transferPriceBefore: undefined,
    transferPrice: 0,
    transferPriceAfter: 0,
    discount: 0,
    rating: 'Nuevo',
    emoji: '🐾',
    color: '#fff0ec',
    description: '',
    benefits: ['Producto marketplace'],
    taxRate: 0,
    images,
    mainImageId: images[0].id,
    logistics,
    packageDimensions,
    attributes: [],
    richVariations: [],
    variationCombinations: [],
    legacyVariations: {},
    variations: [],
    stockAlertMin: 2,
    stockStatus: 'Pausado',
    shipping: 'Configuración de envío según métodos activos de la tienda.',
    stock: 0,
    status: 'Pausado',
    tags: ['Nuevo'],
  };
}

function createDefaultImages(emoji: string, name: string): ProductImageMock[] {
  return [
    { id: `${name}-main`, emoji, isPrimary: true, label: 'Imagen 1', order: 1 },
  ];
}

function createDefaultPackageDimensions(): ProductPackageDimensions {
  return {
    heightCm: '8',
    lengthCm: '18',
    weight: '250',
    weightUnit: 'g',
    widthCm: '12',
  };
}

function createMockSku(name: string, suffix: string) {
  const normalizedName = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();

  return `${normalizedName || 'HUPI'}-${suffix}`.slice(0, 32);
}

function withoutGeneralSku(product: ProviderMarketplaceProduct): ProviderMarketplaceProduct {
  const nextProduct = { ...product };
  delete nextProduct.sku;
  return nextProduct;
}

function normalizeImages(images: ProductImageMock[], mainImageId: string) {
  return [...images].sort((a, b) => a.order - b.order).map((image, index) => ({
    ...image,
    isPrimary: image.id === mainImageId || (!mainImageId && index === 0),
    order: index + 1,
  }));
}

function createAttribute(kind: ProductVariationKind): ProductAttributeMock {
  const id = `${kind.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
  const options = suggestedVariationOptions[kind].slice(0, kind === 'Color' ? 4 : 3);

  return {
    id,
    kind,
    name: kind === 'Personalizado' ? 'Presentación' : kind,
    options: options.map((option) => createAttributeOption(kind, option)),
  };
}

function createAttributeOption(kind: ProductVariationKind, name: string): ProductAttributeOptionMock {
  return {
    id: `${kind.toLowerCase().replace(/\s+/g, '-')}-${name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(16).slice(2, 6)}`,
    colorHex: kind === 'Color' ? mockColorSwatches[name] ?? '#e45336' : undefined,
    name,
  };
}

function createVariation(attributes: ProductAttributeMock[], selectedOptions: Record<string, string>, index: number): ProductVariationMock {
  const selectedOptionNames = attributes
    .map((attribute) => attribute.options.find((option) => option.id === selectedOptions[attribute.id])?.name)
    .filter(Boolean)
    .join('-');

  return normalizeVariationName({
    id: `variation-${Date.now()}-${index}`,
    name: `Variación ${index}`,
    selectedOptions,
    isSaved: false,
    isActive: true,
    priceBeforeCard: undefined,
    priceAfterCard: 0,
    priceBeforeTransfer: undefined,
    priceAfterTransfer: 0,
    stock: 0,
    stockAlertMin: 2,
    sku: createMockSku(selectedOptionNames || `VARIACION-${index}`, `${index}`),
    status: 'Activa',
    packageDimensions: createDefaultPackageDimensions(),
  }, attributes);
}

function normalizeVariation(variation: ProductVariationMock): ProductVariationMock {
  return variation;
}

function markVariationUnsaved(variation: ProductVariationMock): ProductVariationMock {
  return { ...variation, isSaved: false };
}

function normalizeVariationName(variation: ProductVariationMock, attributes: ProductAttributeMock[]) {
  const name = attributes.map((attribute) => (
    attribute.options.find((option) => option.id === variation.selectedOptions[attribute.id])?.name
  )).filter(Boolean).join(' + ');

  return normalizeVariation({ ...variation, name: name || variation.name });
}

function variationUsesExistingOptions(variation: ProductVariationMock, attributes: ProductAttributeMock[]) {
  return Object.entries(variation.selectedOptions).every(([attributeId, optionId]) => (
    attributes.some((attribute) => attribute.id === attributeId && attribute.options.some((option) => option.id === optionId))
  ));
}

function buildLegacyVariations(attributes: ProductAttributeMock[]) {
  return attributes.reduce<{ color?: string[]; flavor?: string[]; size?: string[] }>((legacy, attribute) => {
    if (attribute.kind === 'Color') {
      legacy.color = attribute.options.map((option) => option.name);
    }

    if (attribute.kind === 'Sabor') {
      legacy.flavor = attribute.options.map((option) => option.name);
    }

    if (attribute.kind === 'Talla' || attribute.kind === 'Tamaño de empaque') {
      legacy.size = attribute.options.map((option) => option.name);
    }

    return legacy;
  }, {});
}

function calculateDiscount(priceBefore: number | undefined, priceCurrent: number) {
  if (!priceBefore || priceBefore <= priceCurrent || priceCurrent <= 0) {
    return 0;
  }

  return Math.round(((priceBefore - priceCurrent) / priceBefore) * 100);
}

function isProductActive(product: ProviderMarketplaceProduct) {
  return product.isActive ?? (product.status === 'Activo' || product.status === 'Sin stock');
}

function isVariationActive(variation: ProductVariationMock) {
  return variation.isActive ?? variation.status !== 'Pausada';
}

function isBlank(value: string | undefined) {
  return !value || value.trim().length === 0;
}

function hasPositiveNumber(value: number | string | undefined) {
  return Number(value) > 0;
}

function hasNonNegativeNumber(value: number | string | undefined) {
  return Number.isFinite(Number(value)) && Number(value) >= 0;
}

function isLowStock(stock: number, stockAlertMin: number) {
  return hasNonNegativeNumber(stock) && hasNonNegativeNumber(stockAlertMin) && stock <= stockAlertMin;
}

function getGlobalMissingFields(product: ProviderMarketplaceProduct) {
  const missingFields: string[] = [];

  if (isBlank(product.name)) {
    missingFields.push('Nombre del producto');
  }

  if (isBlank(product.brand)) {
    missingFields.push('Marca');
  }

  if (isBlank(product.description)) {
    missingFields.push('Descripción');
  }

  if (product.taxRate !== 0 && product.taxRate !== 15) {
    missingFields.push('Impuesto del producto');
  }

  if (isBlank(product.categoryId) || isBlank(product.category)) {
    missingFields.push('Categoría');
  }

  if (!product.mainImageId || !product.images.some((image) => image.id === product.mainImageId)) {
    missingFields.push('Imagen principal');
  }

  return missingFields;
}

function getSimpleMissingFields(product: ProviderMarketplaceProduct) {
  const missingFields: string[] = [];

  if (!hasPositiveNumber(product.cardPriceAfter)) {
    missingFields.push('Precio actual tarjeta');
  }

  if (!hasPositiveNumber(product.transferPriceAfter)) {
    missingFields.push('Precio actual transferencia');
  }

  if (!hasNonNegativeNumber(product.stock)) {
    missingFields.push('Stock disponible');
  }

  if (!hasNonNegativeNumber(product.stockAlertMin)) {
    missingFields.push('Stock mínimo de alerta');
  }

  missingFields.push(...getPackageDimensionsMissingFields(product.packageDimensions));

  return missingFields;
}

function getVariableMissingFields(product: ProviderMarketplaceProduct) {
  const missingFields: string[] = [];

  if (product.attributes.length === 0) {
    missingFields.push('Atributos');
  }

  product.attributes.forEach((attribute) => {
    if (attribute.options.length === 0 || attribute.options.some((option) => isBlank(option.name))) {
      missingFields.push(`Opciones de ${attribute.name || attribute.kind}`);
    }
  });

  product.variations.forEach((variation) => {
    const variationMissingFields = getVariationMissingFields(variation, product.attributes);
    variationMissingFields.forEach((field) => missingFields.push(`${variation.name}: ${field}`));
  });

  return missingFields;
}

function getVariationMissingFields(variation: ProductVariationMock, attributes: ProductAttributeMock[]) {
  const missingFields: string[] = [];

  if (!variationHasValidOption(variation, attributes)) {
    missingFields.push('Atributo/opción asignado');
  }

  if (!hasPositiveNumber(variation.priceAfterCard)) {
    missingFields.push('Precio actual tarjeta');
  }

  if (!hasPositiveNumber(variation.priceAfterTransfer)) {
    missingFields.push('Precio actual transferencia');
  }

  if (!hasNonNegativeNumber(variation.stock)) {
    missingFields.push('Stock disponible');
  }

  if (!hasNonNegativeNumber(variation.stockAlertMin)) {
    missingFields.push('Stock mínimo de alerta');
  }

  missingFields.push(...getPackageDimensionsMissingFields(variation.packageDimensions));

  return missingFields;
}

function getPackageDimensionsMissingFields(dimensions: ProductPackageDimensions) {
  const missingFields: string[] = [];

  if (!hasPositiveNumber(dimensions.weight)) {
    missingFields.push('Peso');
  }

  if (isBlank(dimensions.weightUnit)) {
    missingFields.push('Unidad de peso');
  }

  if (!hasPositiveNumber(dimensions.lengthCm)) {
    missingFields.push('Largo');
  }

  if (!hasPositiveNumber(dimensions.widthCm)) {
    missingFields.push('Ancho');
  }

  if (!hasPositiveNumber(dimensions.heightCm)) {
    missingFields.push('Alto');
  }

  return missingFields;
}

function variationHasValidOption(variation: ProductVariationMock, attributes: ProductAttributeMock[]) {
  const selectedEntries = Object.entries(variation.selectedOptions).filter(([, optionId]) => !isBlank(optionId));

  return selectedEntries.length > 0 && selectedEntries.every(([attributeId, optionId]) => (
    attributes.some((attribute) => attribute.id === attributeId && attribute.options.some((option) => option.id === optionId && !isBlank(option.name)))
  ));
}

function notifyLowStockProduct(product: ProviderMarketplaceProduct) {
  if (product.productType === 'simple' && isLowStock(product.stock, product.stockAlertMin)) {
    addProviderStockNotification(`Tu producto ${product.name || 'sin nombre'} llegó al stock mínimo.`);
    return;
  }

  product.variations.forEach((variation) => notifyLowStockVariation(product.name, variation));
}

function notifyLowStockVariation(productName: string, variation: ProductVariationMock) {
  if (isLowStock(variation.stock, variation.stockAlertMin)) {
    addProviderStockNotification(`La variación ${variation.name} de ${productName || 'este producto'} llegó al stock mínimo.`);
  }
}

function Section({ children, icon, title }: { children: ReactNode; icon: keyof typeof Ionicons.glyphMap; title: string }) {
  return (
    <Card style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}><Ionicons color={colors.primary} name={icon} size={18} /></View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </Card>
  );
}

function SaveFeedbackModal({ onClose, popup }: { onClose: () => void; popup: SavePopupState | null }) {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={Boolean(popup)}>
      <View style={styles.modalOverlay}>
        <View style={styles.saveModalCard}>
          <View style={styles.saveModalIcon}>
            <Ionicons color={colors.white} name={popup?.title === 'Falta una variación' ? 'alert-outline' : 'checkmark'} size={25} />
          </View>
          <Text style={styles.saveModalTitle}>{popup?.title}</Text>
          <Text style={styles.saveModalMessage}>{popup?.message}</Text>
          {popup?.missingFields?.length ? (
            <View style={styles.missingList}>
              {popup.missingFields.map((field) => (
                <Text key={field} style={styles.missingItem}>- {field}</Text>
              ))}
            </View>
          ) : null}
          <Button icon="checkmark-circle-outline" onPress={onClose} title={popup?.buttonLabel ?? 'Entendido'} />
        </View>
      </View>
    </Modal>
  );
}

function MockInput({
  keyboardType,
  label,
  multiline = false,
  onChangeText,
  value,
}: {
  keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
  label: string;
  multiline?: boolean;
  onChangeText: (value: string) => void;
  value: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        onChangeText={onChangeText}
        placeholderTextColor={colors.textMuted}
        style={[styles.input, multiline && styles.multiline]}
        value={value}
      />
    </View>
  );
}

function Dropdown({
  expanded,
  label,
  onSelect,
  onToggle,
  options,
  value,
}: {
  expanded: boolean;
  label: string;
  onSelect: (value: string) => void;
  onToggle: () => void;
  options: { label: string; value: string }[];
  value: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <Pressable onPress={onToggle} style={styles.dropdownButton}>
        <Text style={styles.dropdownValue}>{value}</Text>
        <Ionicons color={colors.secondary} name={expanded ? 'chevron-up' : 'chevron-down'} size={18} />
      </Pressable>
      {expanded ? (
        <View style={styles.dropdownList}>
          {options.map((option) => (
            <Pressable key={option.value} onPress={() => onSelect(option.value)} style={styles.dropdownOption}>
              <Text style={[styles.dropdownOptionText, option.label === value && styles.dropdownOptionTextActive]}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function TagSelector({ selected, toggleTag }: { selected: MarketplaceProductTag[]; toggleTag: (tag: MarketplaceProductTag) => void }) {
  return (
    <ChipGroup
      label="__hupi_i18n:common.tags"
      multiple
      onSelect={(value) => toggleTag(value as MarketplaceProductTag)}
      options={productTags}
      selected={selected}
    />
  );
}

function ChipGroup({
  label,
  multiple = false,
  onSelect,
  options,
  selected,
}: {
  label: string;
  multiple?: boolean;
  onSelect: (value: string) => void;
  options: string[];
  selected: string[];
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}{multiple ? ' · selección múltiple' : ''}</Text>
      <View style={styles.chipRow}>
        {options.map((option) => {
          const active = selected.includes(option);

          return (
            <Pressable key={option} onPress={() => onSelect(option)} style={[styles.chip, active && styles.activeChip]}>
              <Text style={[styles.chipText, active && styles.activeChipText]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MiniButton({ disabled = false, label, onPress }: { disabled?: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.miniButton, disabled && styles.miniButtonDisabled]}>
      <Text style={styles.miniButtonText}>{label}</Text>
    </Pressable>
  );
}

function SwitchControl({
  active,
  label,
  offText,
  onText,
  onToggle,
}: {
  active: boolean;
  label: string;
  offText: string;
  onText: string;
  onToggle: () => void;
}) {
  return (
    <Pressable onPress={onToggle} style={styles.switchRow}>
      <View style={styles.switchCopy}>
        <Text style={styles.inputLabel}>{label}</Text>
        <Text style={[styles.switchState, active && styles.switchStateActive]}>{active ? onText : offText}</Text>
      </View>
      <View style={[styles.switchTrack, active && styles.switchTrackActive]}>
        <View style={[styles.switchKnob, active && styles.switchKnobActive]} />
      </View>
    </Pressable>
  );
}

function LowStockAlert() {
  return (
    <View style={styles.lowStockAlert}>
      <Ionicons color={colors.primary} name="alert-circle-outline" size={17} />
      <Text style={styles.lowStockText}>__hupi_i18n:common.lowStock</Text>
    </View>
  );
}

function PricePreview({ after, before, label }: { after: number; before?: number; label: string }) {
  const discount = calculateDiscount(before, after);

  return (
    <View style={styles.pricePreview}>
      <Text style={styles.previewLabel}>{label}</Text>
      {before && before > after ? <Text style={styles.oldPrice}>{formatMarketplaceCurrency(before)}</Text> : null}
      <Text style={styles.currentPrice}>{formatMarketplaceCurrency(after || 0)}</Text>
      {discount > 0 ? <Text style={styles.discountPill}>-{discount}%</Text> : null}
    </View>
  );
}

function AttributeEditor({
  attribute,
  onAddOption,
  onRemoveOption,
  onUpdateName,
  onUpdateOption,
}: {
  attribute: ProductAttributeMock;
  onAddOption: () => void;
  onRemoveOption: (optionId: string) => void;
  onUpdateName: (name: string) => void;
  onUpdateOption: (optionId: string, updates: Partial<ProductAttributeOptionMock>) => void;
}) {
  return (
    <Card style={styles.variationCard} tone="soft">
      <Text style={styles.variationTitle}>{attribute.kind}</Text>
      {attribute.kind === 'Personalizado' ? (
        <MockInput label="__hupi_i18n:provider.product-editor.attributeName" onChangeText={onUpdateName} value={attribute.name} />
      ) : null}
      {attribute.options.map((option) => (
        <View key={option.id} style={styles.optionCard}>
          <View style={styles.optionHeader}>
            {attribute.kind === 'Color' ? <View style={[styles.colorDot, { backgroundColor: option.colorHex ?? colors.primary }]} /> : null}
            <TextInput
              onChangeText={(value) => onUpdateOption(option.id, { name: value })}
              style={styles.optionNameInput}
              value={option.name}
            />
            <Pressable onPress={() => onRemoveOption(option.id)} style={styles.trashButton}>
              <Ionicons color={colors.primary} name="trash-outline" size={17} />
            </Pressable>
          </View>
          {attribute.kind === 'Color' ? (
            <View style={styles.swatches}>
              {Object.entries(mockColorSwatches).map(([name, hex]) => (
                <Pressable key={name} onPress={() => onUpdateOption(option.id, { colorHex: hex, name })} style={[styles.swatch, { backgroundColor: hex }, option.colorHex === hex && styles.swatchActive]} />
              ))}
            </View>
          ) : null}
        </View>
      ))}
      <Button icon="add-circle-outline" onPress={onAddOption} title="__hupi_i18n:common.addOption" variant="outline" />
    </Card>
  );
}

function VariationCard({
  attributes,
  onRemove,
  onSave,
  onToggleActive,
  onUpdate,
  onUpdateDimensions,
  onUpdateOption,
  variation,
}: {
  attributes: ProductAttributeMock[];
  onRemove: () => void;
  onSave: () => void;
  onToggleActive: () => void;
  onUpdate: (updates: Partial<ProductVariationMock>) => void;
  onUpdateDimensions: (updates: Partial<ProductPackageDimensions>) => void;
  onUpdateOption: (attributeId: string, optionId: string) => void;
  variation: ProductVariationMock;
}) {
  const variationActive = isVariationActive(variation);
  const variationStockLow = isLowStock(variation.stock, variation.stockAlertMin);

  return (
    <View style={styles.combinationCard}>
      <View style={styles.variationHeader}>
        <View style={styles.variationTitleBlock}>
          <View style={styles.variationTitleRow}>
            <Text style={styles.combinationTitle}>{variation.name}</Text>
            {variation.isSaved ? <Ionicons color={colors.success} name="checkmark-circle" size={16} /> : null}
          </View>
          <Text style={[styles.saveStateText, variation.isSaved && styles.saveStateTextSaved]}>
            {variation.isSaved ? 'Guardada' : 'Pendiente de guardar'}
          </Text>
        </View>
        <Pressable onPress={onRemove} style={styles.trashButton}>
          <Ionicons color={colors.primary} name="trash-outline" size={17} />
        </Pressable>
      </View>
      <SwitchControl
        active={variationActive}
        label="__hupi_i18n:provider.product-editor.turnYourProductOnOrOff"
        offText="No visible en marketplace"
        onText="Visible en marketplace"
        onToggle={onToggleActive}
      />
      {attributes.map((attribute) => (
        <View key={attribute.id} style={styles.inputGroup}>
          <Text style={styles.inputLabel}>{attribute.name}</Text>
          <View style={styles.chipRow}>
            {attribute.options.map((option) => {
              const active = variation.selectedOptions[attribute.id] === option.id;

              return (
                <Pressable key={option.id} onPress={() => onUpdateOption(attribute.id, option.id)} style={[attribute.kind === 'Color' ? styles.colorChip : styles.chip, active && styles.activeChip]}>
                  {attribute.kind === 'Color' ? <View style={[styles.colorDotSmall, { backgroundColor: option.colorHex ?? colors.primary }]} /> : null}
                  <Text style={[styles.chipText, active && styles.activeChipText]}>{option.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      <MockInput label="__hupi_i18n:common.sku2" onChangeText={(value) => onUpdate({ sku: value })} value={variation.sku} />
      <View style={styles.twoColumns}>
        <MockInput keyboardType="decimal-pad" label="__hupi_i18n:provider.product-editor.priceBeforeCard" onChangeText={(value) => onUpdate({ priceBeforeCard: Number(value || 0) })} value={`${variation.priceBeforeCard ?? ''}`} />
        <MockInput keyboardType="decimal-pad" label="__hupi_i18n:provider.product-editor.currentCardPrice" onChangeText={(value) => onUpdate({ priceAfterCard: Number(value || 0) })} value={`${variation.priceAfterCard}`} />
      </View>
      <PricePreview after={variation.priceAfterCard} before={variation.priceBeforeCard} label="__hupi_i18n:common.card2" />
      <View style={styles.twoColumns}>
        <MockInput keyboardType="decimal-pad" label="__hupi_i18n:provider.product-editor.priceBeforeTransfer" onChangeText={(value) => onUpdate({ priceBeforeTransfer: Number(value || 0) })} value={`${variation.priceBeforeTransfer ?? ''}`} />
        <MockInput keyboardType="decimal-pad" label="__hupi_i18n:provider.product-editor.currentTransferPrice" onChangeText={(value) => onUpdate({ priceAfterTransfer: Number(value || 0) })} value={`${variation.priceAfterTransfer}`} />
      </View>
      <PricePreview after={variation.priceAfterTransfer} before={variation.priceBeforeTransfer} label="__hupi_i18n:provider.product-editor.transferDeuna" />
      <View style={styles.twoColumns}>
        <MockInput keyboardType="number-pad" label="__hupi_i18n:common.stockAvailable" onChangeText={(value) => onUpdate({ stock: Number(value || 0) })} value={`${variation.stock}`} />
        <MockInput keyboardType="number-pad" label="__hupi_i18n:provider.product-editor.minimumAlertStock" onChangeText={(value) => onUpdate({ stockAlertMin: Number(value || 0) })} value={`${variation.stockAlertMin}`} />
      </View>
      {variationStockLow ? <LowStockAlert /> : null}
      <PackageDimensionsEditor
        dimensions={variation.packageDimensions}
        onUpdate={(field, value) => onUpdateDimensions({ [field]: value })}
      />
      <Button icon="save-outline" onPress={onSave} title="__hupi_i18n:provider.product-editor.saveVariation" variant="secondary" />
    </View>
  );
}

function PackageDimensionsEditor({
  dimensions,
  onUpdate,
}: {
  dimensions: ProductPackageDimensions;
  onUpdate: <Key extends keyof ProductPackageDimensions>(field: Key, value: ProductPackageDimensions[Key]) => void;
}) {
  return (
    <>
      <View style={styles.twoColumns}>
        <MockInput keyboardType="decimal-pad" label="__hupi_i18n:common.weight" onChangeText={(value) => onUpdate('weight', value)} value={dimensions.weight} />
        <ChipGroup
          label="__hupi_i18n:common.weightUnit"
          onSelect={(value) => onUpdate('weightUnit', value as ProductPackageDimensions['weightUnit'])}
          options={[...weightUnits]}
          selected={[dimensions.weightUnit]}
        />
      </View>
      <View style={styles.threeColumns}>
        <MockInput keyboardType="decimal-pad" label="__hupi_i18n:common.lengthCm" onChangeText={(value) => onUpdate('lengthCm', value)} value={dimensions.lengthCm} />
        <MockInput keyboardType="decimal-pad" label="__hupi_i18n:common.widthCm" onChangeText={(value) => onUpdate('widthCm', value)} value={dimensions.widthCm} />
        <MockInput keyboardType="decimal-pad" label="__hupi_i18n:common.heightCm" onChangeText={(value) => onUpdate('heightCm', value)} value={dimensions.heightCm} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 8, paddingBottom: 42 },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  heading: { flex: 1 },
  title: { color: colors.text, fontSize: 27, fontWeight: '900' },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  section: { gap: 12, marginTop: 16, shadowOpacity: 0.04 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  sectionIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  modalOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(51,51,51,0.35)', padding: 22 },
  saveModalCard: { width: '100%', maxWidth: 360, borderRadius: 24, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', gap: 10, padding: 20 },
  saveModalIcon: { width: 56, height: 56, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  saveModalTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  saveModalMessage: { color: colors.textMuted, fontSize: 13, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
  missingList: { alignSelf: 'stretch', gap: 6, borderRadius: 16, backgroundColor: colors.soft, padding: 12 },
  missingItem: { color: colors.text, fontSize: 13, lineHeight: 19, fontWeight: '800' },
  helpText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  emptyText: { color: colors.textMuted, fontSize: 13, lineHeight: 20, fontWeight: '800' },
  inputGroup: { flex: 1, gap: 5 },
  inputLabel: { color: colors.text, fontSize: 12, fontWeight: '900' },
  input: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, color: colors.text, paddingHorizontal: 12, fontSize: 13, fontWeight: '800' },
  multiline: { minHeight: 84, paddingTop: 11, textAlignVertical: 'top' },
  twoColumns: { flexDirection: 'row', gap: 9 },
  threeColumns: { flexDirection: 'row', gap: 7 },
  dropdownButton: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 },
  dropdownValue: { color: colors.text, fontSize: 13, fontWeight: '900' },
  dropdownList: { borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, overflow: 'hidden' },
  dropdownOption: { minHeight: 38, justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 12 },
  dropdownOptionText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  dropdownOptionTextActive: { color: colors.primary, fontWeight: '900' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 35, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, justifyContent: 'center', paddingHorizontal: 11 },
  colorChip: { minHeight: 36, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', flexDirection: 'row', gap: 7, paddingHorizontal: 10 },
  activeChip: { borderColor: colors.primary, backgroundColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  activeChipText: { color: colors.white },
  mainImageBox: { height: 168, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' },
  mainImageEmoji: { fontSize: 58 },
  mainImageLabel: { color: colors.text, fontSize: 13, fontWeight: '900', marginTop: 8 },
  thumbnailGrid: { gap: 10 },
  thumbnailCard: { borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 10 },
  thumbnailPrimary: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  thumbnailTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumbnailEmoji: { fontSize: 30 },
  thumbnailCopy: { flex: 1 },
  thumbnailText: { color: colors.text, fontSize: 13, fontWeight: '900' },
  thumbnailMeta: { color: colors.textMuted, fontSize: 12, fontWeight: '800', marginTop: 3 },
  thumbnailActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  miniButton: { minHeight: 28, borderRadius: 999, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', paddingHorizontal: 8 },
  miniButtonDisabled: { opacity: 0.45 },
  miniButtonText: { color: colors.primary, fontSize: 12, fontWeight: '900' },
  switchRow: { minHeight: 56, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 12 },
  switchCopy: { flex: 1, gap: 4 },
  switchState: { color: colors.textMuted, fontSize: 13, fontWeight: '900' },
  switchStateActive: { color: colors.secondary },
  switchTrack: { width: 48, height: 28, borderRadius: 999, backgroundColor: colors.border, justifyContent: 'center', padding: 3 },
  switchTrackActive: { backgroundColor: colors.secondary },
  switchKnob: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.white },
  switchKnobActive: { marginLeft: 20 },
  lowStockAlert: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, borderWidth: 1, borderColor: '#f3c2b8', backgroundColor: colors.primarySoft, padding: 10 },
  lowStockText: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  pricePreview: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9, borderRadius: 15, backgroundColor: colors.soft, padding: 11 },
  previewLabel: { color: colors.secondary, fontSize: 12, fontWeight: '900' },
  oldPrice: { color: colors.textMuted, fontSize: 15, fontWeight: '900', textDecorationLine: 'line-through' },
  currentPrice: { color: colors.primary, fontSize: 19, fontWeight: '900' },
  discountPill: { borderRadius: 999, backgroundColor: colors.primary, color: colors.white, fontSize: 12, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 5, overflow: 'hidden' },
  variationCard: { gap: 11, shadowOpacity: 0 },
  variationTitle: { color: colors.secondary, fontSize: 15, fontWeight: '900' },
  optionCard: { gap: 9, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 10 },
  optionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionNameInput: { flex: 1, minHeight: 38, borderRadius: 13, borderWidth: 1, borderColor: colors.border, color: colors.text, paddingHorizontal: 10, fontSize: 13, fontWeight: '900' },
  trashButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  colorDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.white },
  colorDotSmall: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.white },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.white },
  swatchActive: { borderColor: colors.text },
  combinationCard: { gap: 10, borderRadius: 16, backgroundColor: colors.soft, padding: 10 },
  variationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  variationTitleBlock: { flex: 1, gap: 4 },
  variationTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  combinationTitle: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '900' },
  saveStateText: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: colors.white, color: colors.primary, fontSize: 12, fontWeight: '900', overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 4 },
  saveStateTextSaved: { backgroundColor: colors.secondarySoft, color: colors.secondary },
  actions: { gap: 10, marginTop: 16 },
});
