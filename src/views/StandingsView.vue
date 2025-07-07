<script setup>
import { ref, onMounted } from 'vue'
import Papa from 'papaparse'
import StandingsHeader from '../components/StandingsHeader.vue'
import StandingsRow from '../components/StandingsRow.vue'

const props = defineProps(['series', 'className'])
const rows = ref([])

async function fetchStandings() {
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/.../pub?output=csv'
  const response = await fetch(sheetUrl)
  const csv = await response.text()

  Papa.parse(csv, {
    header: true,
    skipEmptyLines: true,
    complete: (result) => {
      rows.value = result.data.filter(r => r.class === props.className)
    }
  })
}

onMounted(fetchStandings)
</script>

<template>
  <div class="standings-grid">
    <StandingsHeader />
    <StandingsRow v-for="row in rows" :key="row.name" :driver="row" />
  </div>
</template>

<style scoped>
.standings-grid {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100vw;
  gap: 0.25rem;
}
</style>
