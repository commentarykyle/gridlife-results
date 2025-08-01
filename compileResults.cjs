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
  
    // Regex helpers
    const regexQual = /\b(Q\d*|QUAL)\b/;
    const regexPodiumSprint = /\b(PS|PODIUM|SPRINT)\b/;
    const regexOverall = /\b(OV|OVERALL)\b/;
    const regexPractice = /\b(PRACTICE|PR|P\d*)\b/;
    const regexHeat = /\b(HEAT|H\d*)\b/;
  
    // Get last number in the string if any (for session number)
    // This avoids picking earlier year numbers by matching digits that are followed by no other digits after them.
    const lastNumberMatch = file.match(/(\d+)(?!.*\d)/);
    const lastNumber = lastNumberMatch ? lastNumberMatch[1] : null;
  
    // === SERIES-SPECIFIC LOGIC ===
  
    if (series === 'TrackBattle') {
      // Qualifying (loose Q detection, return Q, Q1, Q2, etc)
      if (regexQual.test(file)) {
        const qMatch = file.match(/\bQ\d*\b/);
        return qMatch ? qMatch[0] : 'Q';
      }
  
      // Heat detection - any Heat or H means Heat x (default 1)
      if (regexHeat.test(file)) {
        const heatNumMatch = file.match(/\bH(\d+)\b/);
        const heatNum = heatNumMatch ? heatNumMatch[1] : (lastNumber || '1');
        return `Heat ${heatNum}`;
      }
  
      // Practice (exclude podium/sprint)
      if (regexPractice.test(file) && !regexPodiumSprint.test(file)) {
        const prNumMatch = file.match(/\bP(\d+)\b/);
        return prNumMatch ? `Practice ${prNumMatch[1]}` : 'Practice';
      }
  
      // Podium Sprint
      if (regexPodiumSprint.test(file)) {
        return 'Podium Sprint';
      }
  
      // Overall
      if (regexOverall.test(file)) {
        return 'Overall';
      }
  
      // Fallback: if number present but no race in TrackBattle, treat as Heat x
      if (lastNumber) {
        return `Heat ${lastNumber}`;
      }
  
      return 'Unknown Session';
    }
  
    else if (series === 'GLTC') {
      // Qualifying first (loose, anywhere)
      if (regexQual.test(file)) {
        // Check for number after Q or QUAL for Qualifying x
        const qualNumMatch = file.match(/\bQ(\d+)\b/) || file.match(/\bQUAL(\d+)\b/);
        return qualNumMatch ? `Qualifying ${qualNumMatch[1]}` : 'Qualifying';
      }
  
    // Race with optional letter suffix (e.g., Race 3B)
    const raceLetterMatch = file.match(/\bR(\d+)([A-Z])\b/);

if (raceLetterMatch) {
  return `Race ${raceLetterMatch[1]}${raceLetterMatch[2]}`;
} else if (lastNumber) {
  return `Race ${lastNumber}`;
}

      // Podium Sprint
      if (regexPodiumSprint.test(file)) {
        return 'Podium Sprint';
      }
  
      // Overall
      if (regexOverall.test(file)) {
        return 'Overall';
      }
  
      // Practice fallback
      if (regexPractice.test(file)) {
        const prNumMatch = file.match(/\bP(\d+)\b/);
        return prNumMatch ? `Practice ${prNumMatch[1]}` : 'Practice';
      }
  
      return 'Shootout';
    }

    else if (series === 'RUSH') {
      // Qualifying first (loose, anywhere)
      if (regexQual.test(file)) {
        // Check for number after Q or QUAL for Qualifying x
        const qualNumMatch = file.match(/\bQ(\d+)\b/) || file.match(/\bQUAL(\d+)\b/);
        return qualNumMatch ? `Qualifying ${qualNumMatch[1]}` : 'Qualifying';
      }
  
   // Race with optional letter suffix (e.g., Race 3B)
   const raceLetterMatch = file.match(/\bR(\d+)([A-Z])\b/);

if (raceLetterMatch) {
  return `Race ${raceLetterMatch[1]}${raceLetterMatch[2]}`;
} else if (lastNumber) {
  return `Race ${lastNumber}`;
}

      // Podium Sprint
      if (regexPodiumSprint.test(file)) {
        return 'Podium Sprint';
      }
  
      // Overall
      if (regexOverall.test(file)) {
        return 'Overall';
      }
  
      // Practice fallback
      if (regexPractice.test(file)) {
        const prNumMatch = file.match(/\bP(\d+)\b/);
        return prNumMatch ? `Practice ${prNumMatch[1]}` : 'Practice';
      }
  
      return 'Shootout';
    }

    else if (series === 'GLGT') {
      // Qualifying first (loose, anywhere)
      if (regexQual.test(file)) {
        // Check for number after Q or QUAL for Qualifying x
        const qualNumMatch = file.match(/\bQ(\d+)\b/) || file.match(/\bQUAL(\d+)\b/);
        return qualNumMatch ? `Qualifying ${qualNumMatch[1]}` : 'Qualifying';
      }
  
   // Race with optional letter suffix (e.g., Race 3B)
   const raceLetterMatch = file.match(/\bR(\d+)([A-Z])\b/);
if (raceLetterMatch) {
  return `Race ${raceLetterMatch[1]}${raceLetterMatch[2]}`;
} else if (lastNumber) {
  return `Race ${lastNumber}`;
}

      // Podium Sprint
      if (regexPodiumSprint.test(file)) {
        return 'Podium Sprint';
      }
  
      // Overall
      if (regexOverall.test(file)) {
        return 'Overall';
      }
  
      // Practice fallback
      if (regexPractice.test(file)) {
        const prNumMatch = file.match(/\bP(\d+)\b/);
        return prNumMatch ? `Practice ${prNumMatch[1]}` : 'Practice';
      }
  
      return 'Shootout';
    }
  
    else {
      // Other series fallback
  
      // Heat priority: if Heat or H anywhere, Heat x
      if (regexHeat.test(file)) {
        const heatNumMatch = file.match(/\bH(\d+)\b/);
        const heatNum = heatNumMatch ? heatNumMatch[1] : (lastNumber || '1');
        return `Heat ${heatNum}`;
      }
  
      // Podium Sprint
      if (regexPodiumSprint.test(file)) {
        return 'Podium Sprint';
      }
  
      // Overall
      if (regexOverall.test(file)) {
        return 'Overall';
      }
  
      // Practice
      if (regexPractice.test(file)) {
        const prNumMatch = file.match(/\bP(\d+)\b/);
        return prNumMatch ? `Practice ${prNumMatch[1]}` : 'Practice';
      }
  
      // Qualifying (loose, with optional number)
      if (regexQual.test(file)) {
        const qualNumMatch = file.match(/\bQ(\d+)\b/) || file.match(/\bQUAL(\d+)\b/);
        return qualNumMatch ? `Qualifying ${qualNumMatch[1]}` : 'Qualifying';
      }
  
      // Race fallback
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
  normalized = normalized.replace('[SPEC FIT / ECO CUP]', 'SPEC FIT');
  normalized = normalized.replace('[SPEC FIT / SUNDAE CUP]', 'SPEC FIT');

  // Fix any dash formatting (handle extra/missing spaces and all drive types)
  normalized = normalized.replace(
    /\b(SUPER UNLIMITED|UNLIMITED|TRACK MOD|STREET MOD|STREET GT|STREET|CLUB TR|CLUB SC|SUNDAE CUP|SPEC FIT)[\s\-–]*\b(AWD|RWD|FWD)\b/,
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

function parseCsvFileGLTC(filePath, sessionName, className = 'GLTC') {
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
          class: className, // ✅ use the passed-in className here
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
        const lowerSeries = series.toLowerCase();

        const files = fs.readdirSync(seriesPath)
          .filter(f => f.endsWith('.csv'))
          .sort();

        const key = `${year}-${series.toLowerCase()}`;
        if (!allResults[key]) allResults[key] = {};
        if (!allResults[key][track]) allResults[key][track] = {};

        for (const file of files) {
          const sessionName = parseSessionName(file, series);
          const filePath = path.join(seriesPath, file);

          const useGLTCParser = lowerSeries === 'gltc' || lowerSeries === 'rush' || lowerSeries === 'glgt';
          
          if (useGLTCParser) {
            rows = await parseCsvFileGLTC(filePath, sessionName, series.toUpperCase());
          }
           else {
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
        if (['gltc', 'rush', 'glgt'].includes(lowerSeries)) {
          for (const driverName in allResults[key][track]) {
            const sessions = allResults[key][track][driverName];
          
              // Find the first qualifying session with a valid car model
              const qualSession = sessions.find(
                (s) => s.session.toLowerCase().includes('qual') && s.car && s.car.trim() !== ''
              );
          
              if (qualSession && qualSession.car) {
                const carModel = qualSession.car.trim();
          
                // Backfill missing car models in later sessions
                for (const session of sessions) {
                  if (!session.car || session.car.trim() === '') {
                    session.car = carModel;
                  }
                }
              }
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
