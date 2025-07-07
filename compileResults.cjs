const fs = require('fs');
const path = require('path');
const fastcsv = require('fast-csv');

const inputDir = path.join(__dirname, 'src', 'data');
const outputDir = path.join(__dirname, 'public', 'output');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
function parseSessionName(fileName, series) {
    const file = fileName.toUpperCase().replace(/\.CSV$/, '');
  
    // Get last number in the string if any
    const lastNumberMatch = file.match(/(\d+)(?!.*\d)/);
    const lastNumber = lastNumberMatch ? lastNumberMatch[1] : null;
  
    // Helper for loose Q/Qual match (anywhere in string)
    const hasQ = /Q\d*|QUAL/i.test(file);
  
    if (series === 'TrackBattle') {
      // TrackBattle: Q sessions return Q or Q1, Q2, etc
      if (hasQ) {
        const qMatch = file.match(/Q\d*/);
        return qMatch ? qMatch[0] : 'Q';
      }
  
      // Heat sessions (H or HEAT anywhere)
      if (/HEAT|H\d*/.test(file)) {
        const heatNumMatch = file.match(/H(\d+)/);
        const heatNum = heatNumMatch ? heatNumMatch[1] : lastNumber || '1';
        return `Heat ${heatNum}`;
      }
  
      // Practice sessions (exclude podium/sprint)
      if (/PRACTICE|PR|P\d*/.test(file) && !/PS|PODIUM|SPRINT/.test(file)) {
        const prNumMatch = file.match(/P(\d+)/);
        const prNum = prNumMatch ? prNumMatch[1] : '';
        return prNum ? `Practice ${prNum}` : 'Practice';
      }
  
      // Podium Sprint
      if (/PS|PODIUM|SPRINT/.test(file)) {
        return 'Podium Sprint';
      }
  
      // Overall
      if (/OV|OVERALL/.test(file)) {
        return 'Overall';
      }
  
      // If number present and none of above matched, return Heat (never Race)
      if (lastNumber) {
        return `Heat ${lastNumber}`;
      }
  
      return 'Unknown Session';
  
    } else if (series === 'GLTC') {
      // GLTC: loose Qual match means Qualifying
      if (hasQ) {
        return 'Qualifying';
      }
  
      // Race: last number is race number if present (never Heat)
      if (lastNumber) {
        return `Race ${lastNumber}`;
      }
  
      // Podium Sprint
      if (/PS|PODIUM|SPRINT/.test(file)) {
        return 'Podium Sprint';
      }
  
      // Overall
      if (/OV|OVERALL/.test(file)) {
        return 'Overall';
      }
  
      // Practice fallback (if any)
      if (/PRACTICE|PR|P\d*/.test(file)) {
        const prNumMatch = file.match(/P(\d+)/);
        const prNum = prNumMatch ? prNumMatch[1] : '';
        return prNum ? `Practice ${prNum}` : 'Practice';
      }
  
      return 'Unknown Session';
  
    } else {
      // Other series fallback
  
      // Heat priority: if "Heat" or "H" anywhere, Heat x
      if (/HEAT|H/.test(file)) {
        const heatNumMatch = file.match(/H(\d+)/);
        const heatNum = heatNumMatch ? heatNumMatch[1] : lastNumber || '1';
        return `Heat ${heatNum}`;
      }
  
      // Podium Sprint
      if (/PS|PODIUM|SPRINT/.test(file)) {
        return 'Podium Sprint';
      }
  
      // Overall
      if (/OV|OVERALL/.test(file)) {
        return 'Overall';
      }
  
      // Practice
      if (/P/.test(file)) {
        const prNumMatch = file.match(/P(\d+)/);
        const prNum = prNumMatch ? prNumMatch[1] : '';
        return prNum ? `Practice ${prNum}` : 'Practice';
      }
  
      // Qualifying: detect number after Q or QUAL and return Qualifying x
      if (hasQ) {
        const qualNumMatch = file.match(/Q(\d+)/) || file.match(/QUAL(\d+)/);
        if (qualNumMatch) {
          return `Qualifying ${qualNumMatch[1]}`;
        } else {
          return 'Qualifying';
        }
      }
  
      // Race fallback for others
      if (lastNumber) {
        return `Race ${lastNumber}`;
      }
  
      return 'Unknown Session';
    }
  }
  
function normalizeClassName(name) {
  if (!name || typeof name !== 'string') return 'Unknown';

  let normalized = name.trim().toUpperCase();

  // Normalize long-form class names
  normalized = normalized.replace('TRACK MODIFIED', 'TRACK MOD');
  normalized = normalized.replace('STREET MODIFIED', 'STREET MOD');

  // Fix any dash formatting (handle extra/missing spaces and all drive types)
  normalized = normalized.replace(
    /\b(SUPER UNLIMITED|UNLIMITED|TRACK MOD|STREET MOD|STREET GT|STREET|CLUB TR|CLUB SC|SUNDAE CUP)[\s\-–]*\b(AWD|RWD|FWD)\b/,
    '$1 - $2'
  );

  return normalized.trim();
}

function parseCsvFile(filePath, sessionName) {
  // For non-GLTC series, standard parsing
  return new Promise((resolve) => {
    const rows = [];
    let parsing = false;

    fs.createReadStream(filePath)
      .pipe(fastcsv.parse({ headers: false, ignoreEmpty: true }))
      .on('data', (row) => {
        const firstCol = row[0]?.trim();

        if (!parsing && /^\d+$/.test(firstCol)) {
          parsing = true;
        }

        if (parsing) {
          if (!/^\d+$/.test(firstCol)) return;
          rows.push({
            pos: row[0],
            number: row[1],
            name: row[2],
            class: normalizeClassName(row[3]),
            time: row[4],
            car: row[5],
            session: sessionName,
          });
        }
      })
      .on('end', () => resolve(rows));
  });
}

function parseCsvFileGLTC(filePath, sessionName) {
  // For GLTC, different format with extra fields
  return new Promise((resolve) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(fastcsv.parse({ headers: false, ignoreEmpty: true }))
      .on('data', (row) => {
        const firstCol = row[0]?.trim();
        if (!/^\d+$/.test(firstCol)) return;

        rows.push({
          pos: row[0],
          number: row[1],
          name: row[2],
          car: row[3],
          time: row[4],
          session: sessionName,
          laps: row[6] || '',
          gap: row[7] || '',
          class: 'GLTC',
        });
      })
      .on('end', () => resolve(rows));
  });
}

async function compileResults() {
  const allResults = {};

  const years = fs.readdirSync(inputDir);
  for (const year of years) {
    const yearPath = path.join(inputDir, year);
    if (!fs.statSync(yearPath).isDirectory()) continue;

    const tracks = fs.readdirSync(yearPath);
    for (const track of tracks) {
      const trackPath = path.join(yearPath, track);
      if (!fs.statSync(trackPath).isDirectory()) continue;

      const seriesList = fs.readdirSync(trackPath);
      for (const series of seriesList) {
        const seriesPath = path.join(trackPath, series);
        if (!fs.statSync(seriesPath).isDirectory()) continue;

        const files = fs.readdirSync(seriesPath)
          .filter(f => f.endsWith('.csv'))
          .sort();

        const key = `${year}-${series.toLowerCase()}`;
        if (!allResults[key]) allResults[key] = {};
        if (!allResults[key][track]) allResults[key][track] = {};

        for (const file of files) {
          const sessionName = parseSessionName(file);
          const filePath = path.join(seriesPath, file);

          let rows;
          if (key.includes('gltc')) {
            rows = await parseCsvFileGLTC(filePath, sessionName);
          } else {
            rows = await parseCsvFile(filePath, sessionName);
          }

          for (const row of rows) {
            if (!allResults[key][track][row.name]) {
              allResults[key][track][row.name] = [];
            }

            allResults[key][track][row.name].push({
              number: row.number,
              class: row.class,
              car: row.car,
              time: row.time,
              session: row.session,
              gap: row.gap || undefined,
              laps: row.laps || undefined,
              pos: row.pos || undefined,
            });
          }
        }

        const outPath = path.join(outputDir, `results-${year}-${series.toLowerCase()}.json`);
        fs.writeFileSync(outPath, JSON.stringify(allResults[key], null, 2));
        console.log(`✅ Saved: ${outPath}`);
      }
    }
  }
}

compileResults();
