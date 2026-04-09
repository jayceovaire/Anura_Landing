<script setup>
import { computed, onMounted, ref } from 'vue'

function normalizeRepoSlug(value) {
  if (!value) return 'your-org/anura'
  const trimmed = value.trim().replace(/\.git$/, '')

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed)
      if (url.hostname.toLowerCase().includes('github.com')) {
        const parts = url.pathname.replace(/^\/+/, '').replace(/\/+$/, '').split('/')
        if (parts.length >= 2) {
          return `${parts[0]}/${parts[1]}`
        }
      }
    } catch {
      return 'your-org/anura'
    }
  }

  const parts = trimmed.replace(/^\/+/, '').replace(/\/+$/, '').split('/')
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`
  }
  return 'your-org/anura'
}

const explicitReleaseUrl = import.meta.env.VITE_GITHUB_RELEASE_URL?.trim()
const inferredRepoFromRelease = explicitReleaseUrl ? normalizeRepoSlug(explicitReleaseUrl) : null
const githubRepoSlug = normalizeRepoSlug(
  import.meta.env.VITE_GITHUB_REPO ?? import.meta.env.VITE_GITHUB_REPO_URL ?? inferredRepoFromRelease,
)
const githubRepoUrl = `https://github.com/${githubRepoSlug}`
const githubReleaseUrl =
  explicitReleaseUrl ?? `${githubRepoUrl}/releases/latest`
const preferredAssetName = import.meta.env.VITE_GITHUB_RELEASE_ASSET_NAME?.trim().toLowerCase()
const repoConfigured = githubRepoSlug !== 'your-org/anura'

const releaseLoading = ref(false)
const releaseError = ref('')
const latestRelease = ref(null)

const coreWorkflows = [
    'No account required, totally free.',
    'No data farming or tracking',
  'Commander deck building and editing',
  'Reusable package management across decks',
  'CRISPI-based role and power analysis',
  'Hypergeometric and Monte Carlo probability tools',
  'Scryfall image caching for fast repeated browsing',
]

const architecture = [
  {
    title: 'Frontend: Vue 3 + Vuetify',
    detail:
      'Composition API SPA handles routing, screen layout, forms, controls, and real-time status rendering.',
  },
  {
    title: 'Backend: Rust + Tauri',
    detail:
      'Native layer handles persistence, filesystem access, updater logic, card search, and image caching through Tauri commands.',
  },
  {
    title: 'IPC Command Flow',
    detail:
      'Views call src/api helpers, helpers invoke Rust commands, Rust returns structured data and emits long-running task events.',
  },
]

const releaseDate = computed(() => {
  if (!latestRelease.value?.published_at) return ''
  return new Date(latestRelease.value.published_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
})

const downloadUrl = computed(() => {
  const assets = latestRelease.value?.assets
  if (!Array.isArray(assets) || assets.length === 0) {
    return githubReleaseUrl
  }

  if (preferredAssetName) {
    const preferred = assets.find((asset) =>
      String(asset?.name ?? '').toLowerCase().includes(preferredAssetName),
    )
    if (preferred?.browser_download_url) {
      return preferred.browser_download_url
    }
  }

  const firstAsset = assets[0]
  return firstAsset?.browser_download_url ?? githubReleaseUrl
})

async function loadLatestRelease() {
  releaseLoading.value = true
  releaseError.value = ''
  try {
    const response = await fetch(`https://api.github.com/repos/${githubRepoSlug}/releases/latest`)
    if (!response.ok) {
      throw new Error(`GitHub API error (${response.status})`)
    }
    latestRelease.value = await response.json()
  } catch (error) {
    releaseError.value = error instanceof Error ? error.message : 'Unable to load release notes'
  } finally {
    releaseLoading.value = false
  }
}

onMounted(() => {
  if (repoConfigured) {
    loadLatestRelease()
  } else {
    releaseError.value = 'Set VITE_GITHUB_REPO or VITE_GITHUB_REPO_URL to load release notes.'
  }
})
</script>

<template>
  <div class="landing-page">
    <div class="bg-orb orb-left" aria-hidden="true"></div>
    <div class="bg-orb orb-right" aria-hidden="true"></div>
    <div class="grid-overlay" aria-hidden="true"></div>

    <header class="topbar">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true"></span>
        <span>Anura</span>
      </div>
      <a class="topbar-link" :href="githubRepoUrl" target="_blank" rel="noopener noreferrer">GitHub</a>
    </header>

    <main class="hero-shell">
      <section class="hero">
        <p class="eyebrow">A magic the gathering companion</p>
        <h1>Build and Analyze decks in one local app.</h1>
        <p class="description">
          Anura combines deck and package editing, collection tracking, data analysis, and simulation tools in a desktop-first workflow.
        </p>

        <div class="actions">
          <a class="download-button" :href="downloadUrl" rel="noopener noreferrer">
            Download Latest Release
          </a>
          <a class="secondary-link" :href="githubRepoUrl" target="_blank" rel="noopener noreferrer">
            View Source
          </a>
        </div>

        <p class="meta">
          Built with a user-first mindset. Runs local, fast, and account-free.
        </p>
      </section>

      <aside class="showcase" aria-label="Anura core features">
        <h2>Core Features</h2>
        <ul>
          <li v-for="item in coreWorkflows" :key="item">
            <span>{{ item }}</span>
          </li>
        </ul>
      </aside>
    </main>

    <section class="content-grid">
      <article class="info-card">
        <h3>Architecture</h3>
        <ul class="detail-list">
          <li v-for="item in architecture" :key="item.title">
            <strong>{{ item.title }}</strong>
            <p>{{ item.detail }}</p>
          </li>
        </ul>
      </article>

      <article class="info-card">
        <h3>Latest release notes</h3>
        <p v-if="releaseLoading" class="release-state">Loading latest release...</p>
        <p v-else-if="releaseError" class="release-state release-error">{{ releaseError }}</p>
        <div v-else-if="latestRelease" class="release-notes-wrap">
          <p class="release-meta">
            <strong>{{ latestRelease.name || latestRelease.tag_name }}</strong>
            <span>{{ latestRelease.tag_name }} • {{ releaseDate }}</span>
          </p>
          <pre class="release-notes">{{ latestRelease.body || 'No release notes were provided.' }}</pre>
          <a class="secondary-link" :href="latestRelease.html_url" target="_blank" rel="noopener noreferrer">
            Open release on GitHub
          </a>
        </div>
      </article>
    </section>
  </div>
</template>
