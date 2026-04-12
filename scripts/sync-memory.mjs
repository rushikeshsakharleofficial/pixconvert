import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const PROJECT_ROOT = process.cwd();
const MEMORY_PATH = path.join(PROJECT_ROOT, 'memory-gemini/context.md');
const OBSIDIAN_CONTEXT = '/home/rushikesh.sakharle/Obsidians/GeminiVault/Gemini/Working/PixConvert/context.md';

function getGitStatus() {
  try {
    return execSync('git log -1 --pretty=%B').toString().trim();
  } catch {
    return 'Manual update';
  }
}

function updateMemory() {
  console.log('🔄 Syncing PixConvert Memory...');
  
  const lastCommit = getGitStatus();
  const timestamp = new Date().toLocaleString();
  
  let context = fs.readFileSync(MEMORY_PATH, 'utf8');
  
  // Simple "Learning" logic: append latest changes
  const updateEntry = `\n### Auto-Update [${timestamp}]\n- **Trigger:** ${lastCommit}\n`;
  
  if (!context.includes(updateEntry)) {
    context += updateEntry;
    fs.writeFileSync(MEMORY_PATH, context);
    
    // Sync to Obsidian
    if (fs.existsSync(path.dirname(OBSIDIAN_CONTEXT))) {
      fs.writeFileSync(OBSIDIAN_CONTEXT, context);
      console.log('✅ Synced to Obsidian.');
    }
  }
  
  console.log('✨ Memory updated successfully.');
}

updateMemory();
