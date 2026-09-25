const fs = require('fs');
const path = require('path');

const TITLES_DIR = path.join(__dirname, 'chapter_titles');
const BOOKS_DIR = path.join(__dirname, '..', 'src', 'data', 'books');
const COMBINED = path.join(__dirname, '..', 'src', 'data', 'nvi_com_pericopes.json');

// Read all part files
const partFiles = fs.readdirSync(TITLES_DIR)
  .filter(f => f.endsWith('.json'))
  .sort();

const allTitles = {};
let totalApplied = 0;
let totalSkipped = 0;

for (const f of partFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(TITLES_DIR, f), 'utf8'));
  for (const [abbrev, titles] of Object.entries(data)) {
    allTitles[abbrev] = titles;
  }
}

console.log(`Loaded titles for ${Object.keys(allTitles).length} books from ${partFiles.length} files`);

const allBooksData = {};
const files = fs.readdirSync(BOOKS_DIR).filter(f => f.endsWith('.json'));

for (const file of files) {
  const abbrev = file.replace('.json', '');
  const filePath = path.join(BOOKS_DIR, file);
  const bookData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const titles = allTitles[abbrev];

  let bookApplied = 0;
  let bookSkipped = 0;

  if (titles && Array.isArray(titles)) {
    for (let cIdx = 0; cIdx < bookData.chapters.length; cIdx++) {
      const chapter = bookData.chapters[cIdx];
      if (cIdx >= titles.length) {
        console.warn(`  WARNING: ${abbrev} ch${cIdx + 1} has no title in data (titles[${titles.length}] out of bounds)`);
        bookSkipped++;
        continue;
      }

      const title = titles[cIdx];
      const firstVerse = chapter[0];

      // Skip if verse already has a title
      if (typeof firstVerse === 'object' && firstVerse.title) {
        bookSkipped++;
        continue;
      }

      // Add title to verse 0 (first verse)
      if (typeof firstVerse === 'object') {
        firstVerse.title = title;
      } else if (typeof firstVerse === 'string') {
        chapter[0] = { text: firstVerse, title };
      }
      bookApplied++;
    }
  }

  // Rewrite the book file with updated data
  fs.writeFileSync(filePath, JSON.stringify(bookData, null, 2) + '\n', 'utf8');

  // Collect for combined file
  allBooksData[abbrev] = bookData;

  totalApplied += bookApplied;
  totalSkipped += bookSkipped;

  const status = bookApplied > 0 ? `+${bookApplied}` : 'no change';
  console.log(`  ${abbrev.padEnd(5)} ${status}${bookSkipped > 0 ? ` (${bookSkipped} skipped)` : ''}`);
}

// Write combined file
fs.writeFileSync(COMBINED, JSON.stringify(allBooksData, null, 2), 'utf8');

console.log(`\nDone! Applied titles to ${totalApplied} chapters, skipped ${totalSkipped} (already had titles).`);
console.log(`Combined file written to ${COMBINED}`);
