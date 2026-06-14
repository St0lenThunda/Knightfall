import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const srcDir = './public/pieces/classic';
const destDir = './public/pieces/token';

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

// Generate the 3D Coin Template SVG dynamically
function makeCoinSvg(isWhite) {
  const extColor = isWhite ? 'url(#whiteExtrusion)' : 'url(#blackExtrusion)';
  const rimColor = isWhite ? 'url(#whiteRim)' : 'url(#blackRim)';
  const faceColor = isWhite ? 'url(#whiteFace)' : 'url(#blackFace)';
  const strokeColor = isWhite ? '#ffffff' : '#3a3a40';
  const innerRimColor = isWhite ? '#cccccc' : '#55555d';

  return `
    <svg width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- White Coin Gradients -->
        <linearGradient id="whiteExtrusion" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#b8b8b8" />
          <stop offset="100%" stop-color="#7a7a7a" />
        </linearGradient>
        <linearGradient id="whiteFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="40%" stop-color="#f8f8f8" />
          <stop offset="100%" stop-color="#d0d0d0" />
        </linearGradient>
        <linearGradient id="whiteRim" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="#dcdcdc" />
          <stop offset="100%" stop-color="#ffffff" />
        </linearGradient>
        
        <!-- Black Coin Gradients -->
        <linearGradient id="blackExtrusion" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#2a2a2f" />
          <stop offset="100%" stop-color="#0f0f10" />
        </linearGradient>
        <linearGradient id="blackFace" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#3c3c42" />
          <stop offset="50%" stop-color="#1c1c1f" />
          <stop offset="100%" stop-color="#0c0c0e" />
        </linearGradient>
        <linearGradient id="blackRim" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="#141416" />
          <stop offset="100%" stop-color="#4a4a52" />
        </linearGradient>

        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#000000" flood-opacity="0.35" />
        </filter>
      </defs>
      
      <!-- Drop shadow under coin -->
      <ellipse cx="128" cy="144" rx="98" ry="58" fill="#000000" opacity="0.3" filter="url(#shadow)"/>
      
      <!-- 3D Extrusion Edge (multiple stacked ellipses for volume) -->
      <ellipse cx="128" cy="138" rx="96" ry="56" fill="${extColor}"/>
      <ellipse cx="128" cy="136" rx="96" ry="56" fill="${extColor}"/>
      <ellipse cx="128" cy="134" rx="96" ry="56" fill="${extColor}"/>
      <ellipse cx="128" cy="132" rx="96" ry="56" fill="${extColor}"/>
      <ellipse cx="128" cy="130" rx="96" ry="56" fill="${extColor}"/>
      
      <!-- Tilted Coin Rim -->
      <ellipse cx="128" cy="128" rx="96" ry="56" fill="${rimColor}"/>
      
      <!-- Tilted Beveled Coin Face -->
      <ellipse cx="128" cy="128" rx="84" ry="48" fill="${faceColor}"/>
      <ellipse cx="128" cy="128" rx="81" ry="46" fill="none" stroke="${strokeColor}" stroke-width="1.5" opacity="0.4"/>
      <ellipse cx="128" cy="128" rx="76" ry="43" fill="none" stroke="${innerRimColor}" stroke-width="1" opacity="0.2"/>
    </svg>
  `;
}

async function generate() {
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.png'));

  for (const file of files) {
    const isWhite = file.startsWith('w');
    const coinSvg = makeCoinSvg(isWhite);
    
    // Convert SVG background to a sharp image buffer
    const coinBuffer = await sharp(Buffer.from(coinSvg)).toBuffer();

    // Load, tint/contrast, and squash the classic piece glyph to fit isometric perspective (60% height)
    const glyphColor = isWhite ? { r: 30, g: 30, b: 35 } : { r: 235, g: 235, b: 240 };
    const srcPath = path.join(srcDir, file);

    const glyphBuffer = await sharp(srcPath)
      // Tint the glyph to have clear contrasting solid color
      .tint(glyphColor)
      // Resize with non-standard aspect ratio to squash height for 3D perspective
      .resize({
        width: 90,
        height: 60,
        fit: 'fill'
      })
      .toBuffer();

    // Composite the squashed piece glyph on top of the beveled coin face
    await sharp(coinBuffer)
      .composite([{
        input: glyphBuffer,
        top: 96, // Centered vertically on tilted face (offset for tilted center)
        left: 83  // Centered horizontally (256 - 90) / 2 = 83
      }])
      .toFile(path.join(destDir, file));
  }
  console.log('✅ 3D Isometric Tokens generated successfully!');
}

generate().catch(console.error);
