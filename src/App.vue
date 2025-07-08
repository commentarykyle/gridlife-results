<template>
  <div class="app">
    <img src="/gridlife-logo.png" alt="Gridlife Logo" style="height: 40px;" />
    <h1>COMPETITION RESULTS</h1>

    <div class="selector-bar">
      <!-- Year Selector -->
      <label>
        Select Year:
        <select v-model="selectedYear" @change="onYearChange">
          <option disabled value="">-- Select Year --</option>
          <option v-for="year in years" :key="year">{{ year }}</option>
        </select>
      </label>

      <!-- Series Selector -->
      <label v-if="selectedYear">
        Select Series:
        <select v-model="selectedSeries" @change="loadResults">
          <option disabled value="">-- Select Series --</option>
          <option v-for="series in seriesList" :key="series">{{ series }}</option>
        </select>
      </label>

      <!-- Track Selector -->
      <label v-if="tracks.length > 0 && !selectedDriver">
        Select Track:
        <select v-model="selectedTrack" @change="onTrackChange">
          <option disabled value="">-- Select Track --</option>
          <option v-for="track in tracks" :key="track">{{ track }}</option>
        </select>
      </label>

      <!-- Session Selector -->
      <label v-if="sessions.length > 0 && !selectedDriver">
        Select Session:
        <select v-model="selectedSession">
          <option disabled value="">-- Select Session --</option>
          <option v-for="session in sessions" :key="session">{{ session }}</option>
        </select>
      </label>
    </div>

    <!-- Main Results Viewer -->
    <div v-if="filteredDriversByClass && Object.keys(filteredDriversByClass).length && !selectedDriver">
      <h2>{{ selectedSession }} — {{ selectedTrack }} — {{ selectedSeries }} {{ selectedYear }}</h2>

      <div v-for="(drivers, className) in filteredDriversByClass" :key="className" class="class-block">
        <h2>
  <img
    :src="`/${className.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.png`"
    :alt="className"
    style="width: 150px; object-fit: contain;"
    @error="onClassLabelError"
  />
</h2>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Pos</th>
                <th>No.</th>
                <th>Driver</th>
                
                <!-- For TrackBattle, show Time only -->
                <th v-if="selectedSeries === 'TrackBattle'">Time</th>
                
                <!-- For race series (GLTC etc), show Lap, Gap, and Fastest Lap -->
                <template v-else>
                  <th>Laps</th>
                  <th>Gap</th>
                  <th>Fastest Lap</th>
                </template>
                
                <th>Car Model</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="driver in drivers"
                :key="driver.name"
                @click="selectDriver(driver.name, driver.number)"
                class="clickable-driver"
                title="Click to see all lap times for this driver"
              >
                <td>{{ driver.position }}{{ positionSuffix(driver.position) }}</td>
                <td class="number-cell">
                  <div class="number-wrapper">
                    <span>{{ driver.number }}</span>
                    <div
                      class="color-bar"
                      :style="{ backgroundColor: getClassColor(className) }"
                    ></div>
                  </div>
                </td>
                <td>{{ driver.name }}</td>

                <!-- TrackBattle time -->
                <td v-if="selectedSeries === 'TrackBattle'">{{ driver.time }}</td>

                <!-- Race series lap, gap, fastest lap -->
                <template v-else>
                  <td>{{ driver.laps ?? '-' }}</td>
                  <td>{{ driver.gap ?? '-' }}</td>
                  <td>{{ driver.time ?? '-' }}</td>
                </template>

                <td>{{ driver.car }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Driver Detail View -->
    <div v-if="selectedDriver" class="driver-details">
      <h2>
        Driver Profile:
        <span class="driver-first-name">{{ formatDriverName(selectedDriver).first }}</span>
        <span class="driver-last-name">{{ formatDriverName(selectedDriver).last }}</span>
      </h2>
      <button @click="closeDriver" class="close-btn">Close</button>

      <div class="driver-detail-flex">
        <div class="driver-images">
          <img
            class="headshot-img fade-top-to-bottom"
            :src="`https://gridlife.torkhub.live/drivers/${selectedDriverFirst.toLowerCase()}_${selectedDriverLast.toLowerCase()}.png`"
            :alt="`${selectedDriver} headshot`"
            @error="onHeadshotError"
          />
          <div v-if="carImageUrls.length" class="car-images">
            <img
              v-for="(url, i) in carImageUrls"
              :key="i"
              class="car-img"
              :src="url"
              :alt="`${selectedDriver} car ${i + 1}`"
              @error="onCarImageError"
            />
          </div>
        </div>

        <div class="driver-right-column">
          <div class="driver-stats">
            <h3>Driver Stats</h3>
            <ul>
              <li><strong>Years in Competition:</strong> {{ driverStats.years }}</li>
              <li><strong>Circuits Run:</strong> {{ driverStats.uniqueTracks }}</li>
            </ul>
          </div>

          <div class="driver-lap-history">
            <h3>Fastest Laps:</h3>
            <ul>
              <li
                v-for="track in sortedDriverTracks"
                :key="track.name"
                style="margin-bottom: 0.5rem;"
              >
                <div
                  @click="toggleTrack(track.name)"
                  style="cursor: pointer; user-select: none; display: flex; justify-content: space-between; align-items: center;"
                >
                  <span>{{ track.name }} | {{ formatTime(track.bestTime) || 'N/A' }}</span>
                  <span>{{ expandedTrackName === track.name ? '[-]' : '[+]' }}</span>
                </div>

                <transition name="expand" mode="out-in">
                  <div
                    v-if="expandedTrackName === track.name"
                    style="margin-left: 1rem; margin-top: 0.5rem;"
                  >
                    <h4>Personal Bests at {{ track.name }}:</h4>

                    <div
                      v-for="year in getYearsForTrack(track.name)"
                      :key="year"
                      style="margin-bottom: 1.5rem;"
                    >
                      <h5>{{ year }}</h5>
                      <ul style="margin-left: 1rem;">
                        <li
                          v-for="(bestTime, sessionName) in bestTimesBySession(track.name, year)"
                          :key="sessionName"
                        >
                          {{ sessionName }}: {{ formatTime(bestTime) }}
                        </li>
                      </ul>
                    </div>
                  </div>
                </transition>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <p v-if="driverDetailsLoading">Loading driver details...</p>
      <p v-if="driverDetailsError" class="error">⚠️ Failed to load driver details.</p>
    </div>
  </div>
</template>


<script>
export default {
  data() {
    return {
      years: ['2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018'],
      seriesList: ['TrackBattle', 'GLTC'],
      selectedYear: '',
      selectedSeries: '',
      selectedTrack: '',
      selectedSession: '',
      resultsData: null,
      loading: false,
      loadError: false,
      carImageUrls: [],

      selectedDriver: null,
      resolvedDriverKey: null, // store matched driver key here
      driverDetailsLoading: false,
      driverDetailsError: false,
      driverDetailsAllYears: {}, // { year: { trackName: { driverKey: laps[] } } }
      driverTracks: [], // [{ name, bestTime, years: [] }]
      expandedTrackName: null, // which track is expanded
      expandedYearsPerTrack: {}, // { trackName: { year: true/false } }
    };
  },
  computed: {
    selectedDriverFirst() {
  return this.selectedDriver?.split(' ')[0].replace(/[^a-z]/gi, '').toLowerCase() || 'unknown';
},
selectedDriverLast() {
  const parts = this.selectedDriver?.split(' ') || [];
  return parts.length > 1
    ? parts.slice(1).join('').replace(/[^a-z]/gi, '').toLowerCase()
    : 'unknown';
},

carImageUrl() {
  const first = this.selectedDriverFirst.toLowerCase();
  const last = this.selectedDriverLast.toLowerCase();
  const className = this.classOfSelectedDriver?.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') || 'unknown';
  return `https://gridlife.torkhub.live/car_images/${className}_${first}_${last}.png?w=100`;
},

    sortedDriverTracks() {
    return this.driverTracks
      ? [...this.driverTracks].sort((a, b) => a.name.localeCompare(b.name))
      : [];
  },
    driverStats() {
  if (!this.selectedDriver || !this.resolvedDriverKey) {
    return { years: 0, uniqueTracks: 0, wins: 0 };
  }

  const yearSet = new Set();
  const trackSet = new Set();

  for (const year of this.years) {
    const yearData = this.driverDetailsAllYears[year];
    if (!yearData) continue;

    let driverAppearedThisYear = false;

    for (const [trackName, driversAtTrack] of Object.entries(yearData)) {
      if (driversAtTrack[this.resolvedDriverKey]) {
        trackSet.add(trackName);
        driverAppearedThisYear = true;
      }
    }

    if (driverAppearedThisYear) yearSet.add(year);
  }

  return {
    years: yearSet.size,
    uniqueTracks: trackSet.size,
    wins: 0,  // Wins parsing removed
  };
},
    tracks() {
      return this.resultsData ? Object.keys(this.resultsData) : [];
    },
    sessions() {
  if (!this.selectedTrack || !this.resultsData) return [];

  const trackData = this.resultsData[this.selectedTrack];
  if (!trackData) return [];

  const sessionSet = new Set();
  for (const driver in trackData) {
    if (!trackData[driver]) continue;
    trackData[driver].forEach(lap => {
      if (lap.session) sessionSet.add(lap.session);
    });
  }

  return Array.from(sessionSet).sort();
},

filteredDriversByClass() {
  if (!this.selectedTrack || !this.selectedSession) return null;
  const rawDrivers = this.resultsData[this.selectedTrack];
  const grouped = {};

  for (const driverName in rawDrivers) {
    const laps = rawDrivers[driverName];
    const sessionLap = laps.find(lap => lap.session === this.selectedSession);
    if (!sessionLap) continue;
    const baseClass = (sessionLap.class || 'Unknown').split(' - ')[0];

    if (!grouped[baseClass]) grouped[baseClass] = [];

    // Build driver object differently depending on series
    if (this.selectedSeries === 'TrackBattle') {
      grouped[baseClass].push({
        name: driverName,
        number: sessionLap.number,
        time: sessionLap.time,
        car: sessionLap.car,
        rawTime: this.parseTime(sessionLap.time),
        position: null, // will set later
      });
    } else {
      // Race series: include pos, laps, gap, and fastest lap time
      grouped[baseClass].push({
        name: driverName,
        number: sessionLap.number,
        time: sessionLap.time,        // fastest lap time or last time?
        car: sessionLap.car,
        position: parseInt(sessionLap.pos) || 9999,
        laps: sessionLap.laps || '-',
        gap: sessionLap.gap || '-',
        rawTime: this.parseTime(sessionLap.time), // might be useful for fallback sorting
      });
    }
  }

  // Sorting & position assignment
  for (const className in grouped) {
    if (this.selectedSeries === 'TrackBattle') {
      // Sort by raw lap time ascending
      grouped[className].sort((a, b) => {
        if (isNaN(a.rawTime) && isNaN(b.rawTime)) return 0;
        if (isNaN(a.rawTime)) return 1;
        if (isNaN(b.rawTime)) return -1;
        return a.rawTime - b.rawTime;
      });
    } else {
      // Race series: sort by position ascending
      grouped[className].sort((a, b) => a.position - b.position);
    }

    // Assign position within class (1-based)
    grouped[className].forEach((driver, i) => {
      driver.position = i + 1;
    });
  }

  // Class order sorting as you have
  const CLASS_ORDER = [
    "SUPER UNLIMITED",
    "UNLIMITED",
    "TRACK MOD",
    "STREET MOD",
    "STREET GT",
    "STREET",
    "CLUB TR",
    "SUNDAE CUP",
    "CLUB SC",
    "GLTC"  // maybe add series class here if needed
  ];

  const orderedGrouped = {};
  for (const className of CLASS_ORDER) {
    if (grouped[className]) {
      orderedGrouped[className] = grouped[className];
    }
  }
  // Add any extra classes at the end sorted alphabetically
  const extraClasses = Object.keys(grouped)
    .filter(c => !CLASS_ORDER.includes(c))
    .sort();
  for (const c of extraClasses) {
    orderedGrouped[c] = grouped[c];
  }

  return orderedGrouped;
},


  },
  methods: {
    formatDriverName(name) {
    if (!name) return { first: '', last: '' };
    const parts = name.split(' ');
    if (parts.length === 1) {
      return { first: parts[0], last: '' };
    }
    const first = parts[0];
    const last = parts.slice(1).join(' ').toUpperCase();
    return { first, last };
  },
    findAllMatchingCarImages() {
  if (!this.selectedDriver) return;

  const first = this.selectedDriverFirst.toLowerCase();
  const last = this.selectedDriverLast.toLowerCase();
  const namePart = `${first}_${last}`;

  this.carImageUrls = [];

  // Try the most likely 10–15 class prefixes or no prefix
  const tryPrefixes = [
    'clubtr_', 'clubsc_', 'sundaecup_', 'street_', 'streetgt_',
    'streetmod_', 'trackmod_', 'unlimited_', 'superunlimited_', 'gltc_', '', 'unknown_'
  ];

  tryPrefixes.forEach(prefix => {
    const url = `https://gridlife.torkhub.live/car_images/${prefix}${namePart}.png`;

    const img = new Image();
    img.onload = () => {
      if (!this.carImageUrls.includes(url)) this.carImageUrls.push(url);
    };
    img.src = url;
  });
},

    onHeadshotError(event) {
    if (!event.target.dataset.fallback) {
      event.target.src = '/placeholder.png';
      event.target.dataset.fallback = 'true';
    }
  },
  onCarImageError(event) {
    if (!event.target.dataset.fallback) {
      event.target.src = '/placeholder.png';
      event.target.dataset.fallback = 'true';
    }
  },
    getClassColor(className) {
    const colors = {
      'SUPER UNLIMITED': '#b3aa94',
      'UNLIMITED': '#ef3b39',
      'TRACK MOD': '#f26739',
      'STREET MOD': '#4cbd94',
      'STREET GT': '#ffcd05',
      'STREET': '#4c92ce',
      'CLUB TR':'#999999',
      'CLUB SC':'#ed2590',
      'SUNDAE CUP':'#ed2590',
      'GLTC':'#ef3b39',
      'GLGT': '#4c92ce',
      'RUSH SR':'#4c92ce',
      'RUSH SRX':'#ef3b39',
      // Add your actual class-color mappings here
    };
    return colors[className] || '#999'; // default fallback color
  },
    onYearChange() {
  if (!this.selectedYear) return;

  const prevSeries = this.selectedSeries;
  this.selectedSeries = this.seriesList.includes(prevSeries) ? prevSeries : '';
  this.loadResults();
},
    onTrackChange() {
  this.selectedSession = '';

  if (!this.selectedTrack || !this.resultsData) return;

  const drivers = this.resultsData[this.selectedTrack];
  const sessionSet = new Set();

  for (const driver in drivers) {
    for (const lap of drivers[driver]) {
      if (lap.session) sessionSet.add(lap.session);
    }
  }

  const sessions = Array.from(sessionSet).sort();

  // Prioritize 'Podium Sprint', then 'Overall', then fallback to first available
  const podium = sessions.find(s => s.toLowerCase().includes('podium'));
  const overall = sessions.find(s => s.toLowerCase().includes('overall'));
  this.selectedSession = podium || overall || sessions[0] || '';
},

    bestTimesBySession(trackName, year) {
  const sessions = this.trackSessionsGroupedBySession(trackName, year);
  const bestTimes = {};

  for (const [sessionName, laps] of Object.entries(sessions)) {
    let best = Infinity;
    laps.forEach(lap => {
      const raw = this.parseTime(lap.time);
      if (!isNaN(raw) && raw < best) best = raw;
    });
    bestTimes[sessionName] = best === Infinity ? null : best;
  }

  return bestTimes;
},
    resetSelection() {
      this.selectedSeries = '';
      this.selectedTrack = '';
      this.selectedSession = '';
      this.resultsData = null;
      this.selectedDriver = null;
      this.resolvedDriverKey = null;
      this.driverDetailsAllYears = {};
      this.driverTracks = [];
      this.expandedTrackName = null;
      this.expandedYearsPerTrack = {};
    },
    async loadResults() {
      if (!this.selectedYear || !this.selectedSeries) return;
      this.loading = true;
      this.loadError = false;
      this.resultsData = null;
      this.selectedTrack = '';
      this.selectedSession = '';
      this.selectedDriver = null;
      this.resolvedDriverKey = null;
      this.driverDetailsAllYears = {};
      this.driverTracks = [];
      this.expandedTrackName = null;
      this.expandedYearsPerTrack = {};
      const filePath = `/output/results-${this.selectedYear}-${this.selectedSeries.toLowerCase()}.json`;
      try {
        const res = await fetch(filePath);
        if (!res.ok) throw new Error(`Failed to fetch ${filePath}`);
        this.resultsData = await res.json();
      } catch (err) {
        console.error(err);
        this.loadError = true;
      } finally {
        this.loading = false;
      }
    },
    parseTime(t) {
      if (!t) return NaN;
      if (typeof t !== 'string') return NaN;
      const cleaned = t.trim().toLowerCase();
      if (['dns', 'dq', 'dnf', 'na'].includes(cleaned)) return NaN;
      const parts = cleaned.split(':');
      if (parts.length === 2) {
        const min = parseFloat(parts[0]);
        const sec = parseFloat(parts[1]);
        if (isNaN(min) || isNaN(sec)) return NaN;
        return min * 60 + sec;
      } else if (parts.length === 1) {
        const sec = parseFloat(parts[0]);
        return isNaN(sec) ? NaN : sec;
      }
      return NaN;
    },
    positionSuffix(pos) {
      const j = pos % 10, k = pos % 100;
      if (j === 1 && k !== 11) return 'st';
      if (j === 2 && k !== 12) return 'nd';
      if (j === 3 && k !== 13) return 'rd';
      return 'th';
    },
    formatTime(rawSeconds) {
      if (rawSeconds == null || isNaN(rawSeconds)) return 'N/A';
      const minutes = Math.floor(rawSeconds / 60);
      const seconds = (rawSeconds % 60).toFixed(3);
      return minutes > 0
        ? `${minutes}:${seconds.padStart(6, '0')}`
        : seconds;
    },

    selectDriverNameFromData(driversData, clickedName, clickedNumber) {
      // Exact match first
      if (driversData[clickedName]) return clickedName;

      // Last name + number fallback
      const normClickedLast = clickedName.toLowerCase().split(' ').slice(-1)[0];
      for (const key in driversData) {
        if (!driversData[key] || driversData[key].length === 0) continue;
        if (
          driversData[key].some(lap => lap.number == clickedNumber) &&
          key.toLowerCase().includes(normClickedLast)
        ) return key;
      }

      return null;
    },

    async selectDriver(clickedName, clickedNumber) {
      this.selectedDriver = clickedName;
      this.resolvedDriverKey = null;
      this.driverDetailsLoading = true;
      this.driverDetailsError = false;
      this.driverDetailsAllYears = {};
      this.driverTracks = [];
      this.expandedTrackName = null;
      this.expandedYearsPerTrack = {};

      const loadPromises = this.years.map(async (year) => {
        try {
          const path = `/output/results-${year}-${this.selectedSeries.toLowerCase()}.json`;
          const res = await fetch(path);
          if (!res.ok) throw new Error(`Failed to fetch ${path}`);
          const yearDataRaw = await res.json();

          const yearDataNormalized = {};
          for (const track in yearDataRaw) {
            const driversInTrack = yearDataRaw[track];
            const matchedDriverKey = this.selectDriverNameFromData(
              driversInTrack,
              clickedName,
              clickedNumber
            );
            if (matchedDriverKey) {
              yearDataNormalized[track] = {
                [matchedDriverKey]: driversInTrack[matchedDriverKey],
              };
              // Save the driver key found, but only once (prefer latest year first)
              if (!this.resolvedDriverKey) this.resolvedDriverKey = matchedDriverKey;
            }
          }
          this.driverDetailsAllYears[year] = yearDataNormalized;
          this.findAllMatchingCarImages();

        } catch (e) {
          console.warn(`Failed to load data for year ${year}`, e);
        }
      });

      await Promise.all(loadPromises);
      this.buildDriverTracks();
      this.driverDetailsLoading = false;
    },

    buildDriverTracks() {
      const trackMap = {};

      for (const year of this.years) {
        const yearData = this.driverDetailsAllYears[year];
        if (!yearData) continue;

        for (const track in yearData) {
          const laps = yearData[track][this.resolvedDriverKey];
          if (!laps) continue;

          if (!trackMap[track]) {
            trackMap[track] = {
              name: track,
              bestTime: Infinity,
              years: new Set(),
            };
          }

          trackMap[track].years.add(year);

          laps.forEach(lap => {
            const raw = this.parseTime(lap.time);
            if (!isNaN(raw) && raw < trackMap[track].bestTime) {
              trackMap[track].bestTime = raw;
            }
          });
        }
      }

      this.driverTracks = Object.values(trackMap).map(track => ({
        name: track.name,
        bestTime: track.bestTime === Infinity ? null : track.bestTime,
        years: Array.from(track.years).sort((a,b) => b - a), // descending years
      }));
    },

    trackSessionsGroupedBySession(trackName, year) {
      if (!this.driverDetailsAllYears[year]) return {};
      const yearData = this.driverDetailsAllYears[year];
      if (!yearData[trackName]) return {};
      const laps = yearData[trackName][this.resolvedDriverKey];
      if (!laps) return {};

      const sessionsGrouped = {};
      laps.forEach(lap => {
        const sessionName = lap.session || 'Unknown';
        if (!sessionsGrouped[sessionName]) sessionsGrouped[sessionName] = [];
        sessionsGrouped[sessionName].push(lap);
      });
      return sessionsGrouped;
    },

    toggleTrack(trackName) {
      if (this.expandedTrackName === trackName) {
        this.expandedTrackName = null;
      } else {
        this.expandedTrackName = trackName;
      }
    },

    getYearsForTrack(trackName) {
      const track = this.driverTracks.find(t => t.name === trackName);
      return track ? track.years : [];
    },

    closeDriver() {
      this.selectedDriver = null;
      this.resolvedDriverKey = null;
      this.driverDetailsAllYears = {};
      this.driverTracks = [];
      this.expandedTrackName = null;
      this.expandedYearsPerTrack = {};
    },
  },
};
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Proxima+Nova:wght@400;700;900&display=swap');

.app {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  background: #051e21;
  min-height: 100vh;
  box-sizing: border-box;
  overflow-x: hidden;
}


h1 {
  font-size: 2rem;
  color: #ffffff;
  font-weight: 900;
  text-align: center;
  padding: 1rem 0;
}

h2, h3, h4, h5 {
  font-weight: 800;
  color: #9ef7f3;
  margin: 0.5rem 0;
}

label {
  display: block;
  margin: 1rem 0 0.5rem;
  font-weight: 700;
  color: #a0ffff;
}

select {
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: none;
  font-size: 1rem;
  background: #0a2d32;
  color: white;
  outline: none;
  width: 100%;
  max-width: 300px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

select:focus {
  outline: 2px solid #00c9b7;
}

.table-wrapper {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  padding: 0 1rem; /* optional horizontal padding */
}

table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Proxima Nova', sans-serif;
  font-size: 18px;
  color: #fff;
  background: transparent;
  margin-top: 1rem;
  min-width: 800px; /* restored so it doesn't shrink too much */
}
th,
td {
  text-align: left;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  text-transform: uppercase;
}

th {
  background-color: transparent;
  color: #fff;
  font-weight: bold;
  font-size: 20px;
  border-bottom: 2px solid #fff;
}

tbody tr:nth-child(odd) {
  background-color: rgba(255, 255, 255, 0.05);
}

tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.1);
  cursor: pointer;
}

.class-block {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

/* Remove display:block and overflow from .class-block table, let wrapper handle scroll */
.class-block table {
  width: 100%;
  min-width: unset;
  /* display: block; */
  /* overflow-x: auto; */
}

.driver-details {
  background: #153538;
  padding: 1.5rem;
  border-radius: 16px;
  margin-top: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  text-align: left;
  padding-left: 1rem;
}

.driver-details ul {
  padding-left: 1rem;
  list-style-type: disc;
}

.driver-details h3,
.driver-details h4,
.driver-details h5 {
  margin-bottom: 0.5rem;
  margin-top: 1rem;
}

.close-btn {
  background-color: #10393d;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 1rem;
  transition: background-color 0.2s ease;
}

.close-btn:hover {
  background-color: #0c6362;
}

ul {
  list-style: none;
  padding-left: 1rem;
}

li {
  margin: 0.25rem 0;
}

.error {
  color: #ff6b6b;
  font-weight: bold;
  margin-top: 1rem;
}

.selector-bar {
  top: 0;
  z-index: 1000;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  background: rgba(5, 30, 33, 0.9);
  padding: 1rem;
  backdrop-filter: blur(4px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-family: 'Proxima Nova', sans-serif;
  color: #fff;
}

.selector-bar label {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 14px;
  color: #fff;
  display: flex;
  flex-direction: column;
}

.selector-bar select {
  margin-top: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
}

/* Transitions for expanding sections */
.expand-enter-active, .expand-leave-active {
  transition: max-height 0.3s ease, opacity 0.3s ease, padding 0.3s ease;
}

.expand-enter-from, .expand-leave-to {
  max-height: 0;
  opacity: 0;
  padding-top: 0;
  padding-bottom: 0;
  overflow: hidden;
}

.expand-enter-to, .expand-leave-from {
  max-height: 500px; /* large enough for your content */
  opacity: 1;
  padding-top: initial;
  padding-bottom: initial;
}

.driver-detail-container {
  display: flex;
  gap: 2rem;
  margin-top: 1rem;
  align-items: flex-start;
}

.driver-images {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 240px;
}

/* Headshot image fade mask */
.headshot-img {
  width: 100%;
  object-fit: cover;
  max-height: 320px;
  border-radius: 8px;
  margin-bottom: 1rem;
  -webkit-mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
  mask-image: linear-gradient(to bottom, black 60%, transparent 100%);
}

.car-img {
  width: 100%;
  height: auto;
  object-fit: contain;
}

.driver-detail-flex {
  display: flex;
  flex-wrap: nowrap;
  gap: 2rem;
  margin-top: 1rem;
  align-items: flex-start;
  justify-content: flex-start;
}

/* Left column: photos */
.driver-images {
  flex: 0 0 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Right column: stats + lap history stacked */
.driver-right-column {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
}

.driver-stats {
  margin-bottom: 1.5rem;
}

/* Mobile: stack everything vertically */
@media (max-width: 600px) {
  .driver-detail-flex {
    flex-direction: column;
    align-items: center;
  }

  .driver-images {
    flex: none;
    width: 100%;
    max-width: 300px;
  }

  .driver-right-column {
    width: 100%;
  }
}

.driver-name-cell {
  white-space: nowrap;
}

.driver-first-name {
  font-weight: normal;
  color: #ffffff; /* light cyan or your chosen color */
  margin-right: 0.25rem;
  text-transform: capitalize;
}

.driver-last-name {
  font-weight: 900;
  color: #ffffff; /* bright teal or your chosen color */
  text-transform: uppercase;
}

/* Make the table container scrollable on small screens */
.class-block table {
  width: 100%;
  min-width: unset; /* allow shrinking */
  /* display and overflow removed - wrapper handles scroll */
}

/* For the selector bar on small screens */
@media (max-width: 600px) {
  .selector-bar {
    flex-direction: column;
    gap: 0.75rem;
    padding: 1rem 0.5rem;
  }

  .selector-bar label {
    width: 100%;
  }

  .selector-bar select {
    max-width: 100%;
    width: 100%;
  }

  /* Reduce font sizes for table on small screens */
  table {
    font-size: 14px;
  }

  th,
  td {
    padding: 8px 6px;
  }
  
  /* Add margin between class blocks */
  .class-block {
    margin-bottom: 2rem;
  }
}

/* Optional: improve clickable driver row hover for mobile */
tbody tr:hover {
  background-color: rgba(255, 255, 255, 0.15);
}

</style>

