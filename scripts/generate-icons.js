/**
 * VENUZ PWA Icon Generator
 * 
 * Este script genera todos los iconos necesarios para la PWA
 * a partir de un icono base de 512x512.
 * 
 * Uso:
 * 1. Coloca tu icono base en: public/icons/icon-base.png (512x512)
 * 2. Ejecuta: node scripts/generate-icons.js
 * 
 * Requiere: npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../public/icons');
const SPLASH_DIR = path.join(__dirname, '../public/splash');
const BASE_ICON = path.join(ICONS_DIR, 'icon-base.png');

// Tamaños de iconos requeridos
const ICON_SIZES = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

// Tamaños de splash screens para iOS
const SPLASH_SCREENS = [
    { width: 2048, height: 2732, name: 'apple-splash-2048-2732' }, // 12.9" iPad Pro
    { width: 1668, height: 2388, name: 'apple-splash-1668-2388' }, // 11" iPad Pro
    { width: 1536, height: 2048, name: 'apple-splash-1536-2048' }, // 9.7" iPad
    { width: 1125, height: 2436, name: 'apple-splash-1125-2436' }, // iPhone X/XS/11 Pro
    { width: 1242, height: 2688, name: 'apple-splash-1242-2688' }, // iPhone XS Max/11 Pro Max
    { width: 750, height: 1334, name: 'apple-splash-750-1334' },   // iPhone 8/7/6s/6
    { width: 1242, height: 2208, name: 'apple-splash-1242-2208' }, // iPhone 8+/7+/6s+/6+
];

async function generateIcons() {
    // Crear directorios si no existen
    if (!fs.existsSync(ICONS_DIR)) {
        fs.mkdirSync(ICONS_DIR, { recursive: true });
    }
    if (!fs.existsSync(SPLASH_DIR)) {
        fs.mkdirSync(SPLASH_DIR, { recursive: true });
    }

    // Verificar que existe el icono base
    if (!fs.existsSync(BASE_ICON)) {
        console.log('⚠️  No se encontró icon-base.png');
        console.log('   Creando un placeholder...');

        // Crear un placeholder con el logo VENUZ
        await sharp({
            create: {
                width: 512,
                height: 512,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 1 }
            }
        })
            .composite([{
                input: Buffer.from(`
        <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#EC4899;stop-opacity:1" />
              <stop offset="50%" style="stop-color:#F43F5E;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#F59E0B;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" fill="#000"/>
          <text x="256" y="300" font-family="Arial Black, sans-serif" font-size="120" font-weight="900" fill="url(#grad)" text-anchor="middle">V</text>
        </svg>
      `),
                top: 0,
                left: 0,
            }])
            .png()
            .toFile(BASE_ICON);

        console.log('   ✅ Placeholder creado');
    }

    console.log('🎨 Generando iconos PWA para VENUZ...\n');

    // Generar iconos en diferentes tamaños
    for (const size of ICON_SIZES) {
        const outputPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);

        await sharp(BASE_ICON)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 1 }
            })
            .png()
            .toFile(outputPath);

        console.log(`   ✅ icon-${size}x${size}.png`);
    }

    // Generar apple-touch-icon
    await sharp(BASE_ICON)
        .resize(180, 180)
        .png()
        .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
    console.log('   ✅ apple-touch-icon.png');

    // Generar favicon.ico (32x32)
    await sharp(BASE_ICON)
        .resize(32, 32)
        .toFile(path.join(__dirname, '../public/favicon.ico'));
    console.log('   ✅ favicon.ico');

    console.log('\n🖼️  Generando splash screens...\n');

    // Generar splash screens
    for (const splash of SPLASH_SCREENS) {
        const outputPath = path.join(SPLASH_DIR, `${splash.name}.png`);

        // Crear fondo negro con el logo centrado
        const logoSize = Math.min(splash.width, splash.height) * 0.3;

        await sharp({
            create: {
                width: splash.width,
                height: splash.height,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 1 }
            }
        })
            .composite([{
                input: await sharp(BASE_ICON)
                    .resize(Math.round(logoSize), Math.round(logoSize))
                    .toBuffer(),
                gravity: 'center',
            }])
            .png()
            .toFile(outputPath);

        console.log(`   ✅ ${splash.name}.png`);
    }

    // Generar shortcuts icons
    const shortcutIcons = ['nearby', 'live', 'events'];
    console.log('\n🔗 Generando iconos de shortcuts...\n');

    for (const shortcut of shortcutIcons) {
        await sharp(BASE_ICON)
            .resize(96, 96)
            .png()
            .toFile(path.join(ICONS_DIR, `shortcut-${shortcut}.png`));
        console.log(`   ✅ shortcut-${shortcut}.png`);
    }

    console.log('\n✨ ¡Todos los iconos generados exitosamente!\n');
    console.log('📁 Iconos en: public/icons/');
    console.log('📁 Splash screens en: public/splash/');
}

// Ejecutar
generateIcons().catch(console.error);
