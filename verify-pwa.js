import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, 'dist');

console.log('🔍 Iniciando verificación de archivos PWA en la carpeta dist...');

// 1. Check if files exist
const requiredFiles = [
  'manifest.webmanifest',
  'sw.js',
  'registerSW.js'
];

let hasErrors = false;

requiredFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ Archivo encontrado: ${file}`);
  } else {
    console.error(`  ❌ Archivo faltante: ${file}`);
    hasErrors = true;
  }
});

// 2. Validate manifest contents
if (!hasErrors) {
  try {
    const manifestContent = fs.readFileSync(path.join(distPath, 'manifest.webmanifest'), 'utf-8');
    const manifest = JSON.parse(manifestContent);
    
    console.log('\n📄 Validando contenido del manifiesto web...');
    
    if (manifest.name === 'Control de Cobros') {
      console.log('  ✅ name: "Control de Cobros"');
    } else {
      console.error(`  ❌ name incorrecto: ${manifest.name}`);
      hasErrors = true;
    }
    
    if (manifest.short_name === 'Cobros') {
      console.log('  ✅ short_name: "Cobros"');
    } else {
      console.error(`  ❌ short_name incorrecto: ${manifest.short_name}`);
      hasErrors = true;
    }
    
    if (manifest.display === 'standalone') {
      console.log('  ✅ display: "standalone"');
    } else {
      console.error(`  ❌ display incorrecto: ${manifest.display}`);
      hasErrors = true;
    }

    if (manifest.orientation === 'portrait') {
      console.log('  ✅ orientation: "portrait"');
    } else {
      console.error(`  ❌ orientation incorrecto: ${manifest.orientation}`);
      hasErrors = true;
    }
    
    if (Array.isArray(manifest.icons) && manifest.icons.length >= 3) {
      console.log(`  ✅ icons: Encontrados ${manifest.icons.length} íconos`);
      manifest.icons.forEach(icon => {
        const iconPath = path.join(distPath, icon.src);
        if (fs.existsSync(iconPath)) {
          console.log(`    ✅ Icono físico encontrado en dist: ${icon.src}`);
        } else {
          console.error(`    ❌ Icono físico faltante en dist: ${icon.src}`);
          hasErrors = true;
        }
      });
    } else {
      console.error('  ❌ Los íconos no están definidos correctamente o faltan de la lista');
      hasErrors = true;
    }
  } catch (err) {
    console.error(`❌ Error al analizar manifest.webmanifest: ${err.message}`);
    hasErrors = true;
  }
}

console.log('\n----------------------------------------');
if (hasErrors) {
  console.error('❌ Error: La verificación del PWA falló.');
  process.exit(1);
} else {
  console.log('🎉 ¡Prueba de compilación PWA superada con éxito!');
  process.exit(0);
}
