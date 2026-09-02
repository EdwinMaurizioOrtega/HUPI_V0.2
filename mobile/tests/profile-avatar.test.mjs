import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const mobileRoot = new URL('../', import.meta.url);

function read(relativePath) {
  return fs.readFileSync(new URL(relativePath, mobileRoot), 'utf8');
}

test('las tres imágenes predeterminadas son JPEG locales válidos y no están vacías', () => {
  for (const fileName of ['dueno_hupi.jpeg', 'mascota_hupi.jpeg', 'proveedor_hupi.jpeg']) {
    const image = fs.readFileSync(new URL(`assets/profile-defaults/${fileName}`, mobileRoot));
    assert.ok(image.length > 4_000, `${fileName} debe contener la imagen real`);
    assert.deepEqual([...image.subarray(0, 2)], [0xff, 0xd8], `${fileName} debe comenzar con la firma JPEG`);
    assert.deepEqual([...image.subarray(-2)], [0xff, 0xd9], `${fileName} debe terminar con la firma JPEG`);
  }
});

test('las imágenes se requieren una sola vez desde la fuente central', () => {
  const constants = read('src/constants/defaultProfileImages.ts');
  const sourceFiles = ['src/app', 'src/components'].flatMap((directory) => (
    fs.readdirSync(new URL(directory, mobileRoot), { recursive: true })
      .filter((file) => typeof file === 'string' && /\.(ts|tsx)$/.test(file))
      .map((file) => `${directory}/${file}`)
  ));

  assert.match(constants, /owner:\s*require\(['"]\.\.\/\.\.\/assets\/profile-defaults\/dueno_hupi\.jpeg['"]\)/);
  assert.match(constants, /pet:\s*require\(['"]\.\.\/\.\.\/assets\/profile-defaults\/mascota_hupi\.jpeg['"]\)/);
  assert.match(constants, /provider:\s*require\(['"]\.\.\/\.\.\/assets\/profile-defaults\/proveedor_hupi\.jpeg['"]\)/);

  for (const file of sourceFiles) {
    assert.doesNotMatch(read(file), /assets\/profile-defaults\//, `${file} no debe repetir require de avatares`);
  }
});

test('ProfileAvatar prioriza la URI, recorta el marco y recupera errores remotos', () => {
  const component = read('src/components/ProfileAvatar.tsx');

  assert.match(component, /return \{ uri: uri!\.trim\(\) \}/);
  assert.match(component, /return DEFAULT_PROFILE_IMAGES\[type\]/);
  assert.match(component, /onError=\{\(\) =>/);
  assert.match(component, /setRemoteImageFailed\(true\)/);
  assert.match(component, /usesRemoteImage \? 'cover' : 'contain'/);
  assert.match(component, /height: '100%'/);
  assert.match(component, /width: '100%'/);
  assert.match(component, /overflow: 'hidden'/);
  assert.match(component, /StyleSheet\.flatten\(style\)/);
  assert.match(component, /accessibilityRole="image"/);
});

test('las superficies principales usan el avatar reutilizable con el tipo correcto', () => {
  const expectedUsages = {
    'src/app/(tabs)/home.tsx': /ProfileAvatar[^>]+type="owner"/,
    'src/app/(tabs)/profile.tsx': /ProfileAvatar[\s\S]+type="pet"/,
    'src/app/client/pets.tsx': /ProfileAvatar[^>]+type="pet"/,
    'src/app/client/provider-detail.tsx': /ProfileAvatar[^>]+type="provider"/,
    'src/app/client/favorites.tsx': /ProfileAvatar[^>]+type="provider"/,
    'src/components/bookings/BookingCard.tsx': /ProfileAvatar[^>]+type="pet"/,
    'src/components/providers/ProviderCard.tsx': /ProfileAvatar[^>]+type="provider"/,
    'src/app/chat.tsx': /ProfileAvatar[^>]+type=\{displayAvatarType\}/,
  };

  for (const [file, pattern] of Object.entries(expectedUsages)) {
    assert.match(read(file), pattern, `${file} debe usar ProfileAvatar`);
  }
});
