const fs = require('fs');
const path = require('path');

const files = [
  'src/components/AuthModal.vue',
  'src/components/ConfirmModal.vue',
  'src/components/LogoutModal.vue',
  'src/components/TelemetryModal.vue',
  'src/components/admin/PurgeConfirmationModal.vue',
  'src/components/analysis/ImportPgnModal.vue',
  'src/components/analysis/MetadataEditorModal.vue',
  'src/components/play/NewGameModal.vue',
  'src/components/profile/modals/ArchetypeModal.vue',
  'src/components/PuzzleIntroOverlay.vue',
  'src/components/PuzzleSuccessOverlay.vue',
  'src/components/analysis/AnalysisLoadingOverlay.vue',
  'src/components/play/PlayCheatBustedOverlay.vue',
  'src/components/play/PlayGameOverOverlay.vue'
];

files.forEach(file => {
  const filePath = path.join('/Users/thunda/Desktop/Development/Knightfall', file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Step 1: Remove backdrop-filter rules from styles
  content = content.replace(/^\s*backdrop-filter:\s*blur\([^)]+\).*?;\s*$/gm, '');
  content = content.replace(/^\s*-webkit-backdrop-filter:\s*blur\([^)]+\).*?;\s*$/gm, '');
  
  // Step 2: Add backdrop-overlay class to the root overlay element
  // Often it's the first div after <template>
  const templateMatch = content.match(/<template>\s*<div[^>]*class="([^"]*)"/);
  if (templateMatch) {
    const classStr = templateMatch[1];
    if (!classStr.includes('backdrop-overlay')) {
      const newClassStr = classStr + ' backdrop-overlay';
      content = content.replace(templateMatch[0], templateMatch[0].replace(classStr, newClassStr));
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${file}`);
});
