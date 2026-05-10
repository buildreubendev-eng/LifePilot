const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../src/components');

const files = fs.readdirSync(dir);

const replacements = [
  { search: /bg-white/g, replace: 'bg-black/40' },
  { search: /bg-stone-50/g, replace: 'bg-black/20' },
  { search: /bg-stone-100/g, replace: 'bg-white/5' },
  { search: /bg-stone-200/g, replace: 'bg-white/10' },
  { search: /bg-stone-900/g, replace: 'bg-emerald-600' },
  { search: /text-stone-950/g, replace: 'text-white' },
  { search: /text-stone-900/g, replace: 'text-white' },
  { search: /text-stone-800/g, replace: 'text-stone-200' },
  { search: /text-stone-700/g, replace: 'text-stone-300' },
  { search: /text-stone-600/g, replace: 'text-stone-400' },
  { search: /text-stone-500/g, replace: 'text-stone-400' },
  { search: /border-stone-200/g, replace: 'border-white/10' },
  { search: /border-stone-100/g, replace: 'border-white/5' },
  { search: /ring-stone-200/g, replace: 'border border-white/10' },
  { search: /ring-stone-100/g, replace: 'border border-white/5' },
];

for (const file of files) {
  if (!file.endsWith('.tsx')) continue;
  
  // Skip files we already properly redesigned
  if (['DashboardView.tsx', 'ItemCard.tsx', 'Badge.tsx', 'AppFrame.tsx', 'InboxView.tsx', 'TasksView.tsx', 'Section.tsx', 'MetricCard.tsx', 'EmptyState.tsx'].includes(file)) continue;

  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  let modified = false;
  for (const { search, replace } of replacements) {
    if (search.test(content)) {
      content = content.replace(search, replace);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  }
}
