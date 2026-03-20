'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'

type DashboardSummary = {
  total_questions_solved: number
  easy: number
  medium: number
  hard: number
  streak: number
}

const recentQuestions = [
  { name: 'Trapping Rain Water', diff: 'hard', platform: 'LC', time: '2h ago', topic: 'Two Pointers' },
  { name: 'Merge Intervals', diff: 'med', platform: 'LC', time: '5h ago', topic: 'Arrays' },
  { name: 'Word Break', diff: 'med', platform: 'GFG', time: '1d ago', topic: 'DP' },
  { name: 'Number of Islands', diff: 'med', platform: 'LC', time: '1d ago', topic: 'Graphs' },
  { name: 'Valid Parentheses', diff: 'easy', platform: 'CF', time: '2d ago', topic: 'Stack' },
]

const topicMastery = [
  { name: 'Arrays', pct: 88 },
  { name: 'Linked Lists', pct: 72 },
  { name: 'Trees', pct: 61 },
  { name: 'Graphs', pct: 44 },
  { name: 'Dynamic Prog.', pct: 38 },
  { name: 'Greedy', pct: 25 },
]

function masteryColor(pct: number) {
  if (pct >= 80) return 'var(--green)'
  if (pct >= 40) return 'var(--amber)'
  return 'var(--red)'
}

export default function Home() {
  const [summary, setSummary] = useState<DashboardSummary>({
    total_questions_solved: 347,
    easy: 182,
    medium: 134,
    hard: 31,
    streak: 23,
  })
  const [platforms, setPlatforms] = useState<string[]>(['LeetCode ✓', 'GFG ✓', 'CodeForces ✓'])

  useEffect(() => {
    const load = async () => {
      const summaryRes = await apiFetch('/api/v1/dashboard/summary')
      const summaryJson = await summaryRes.json()
      if (summaryJson?.data) {
        setSummary((prev) => ({ ...prev, ...summaryJson.data }))
      }

      const platformRes = await apiFetch('/api/v1/profiles/me/platform-connections')
      const platformJson = await platformRes.json()
      if (Array.isArray(platformJson?.data)) {
        setPlatforms(platformJson.data.map((p: { platform: string }) => `${p.platform} ✓`))
      }
    }

    load().catch(() => undefined)
  }, [])

  const dateLabel = useMemo(
    () =>
      new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [],
  )

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className='shell'>
      <header className='topbar'>
        <div className='logo'>
          <div className='logo-icon'>⚡</div>
          Algo<span>Path</span>
        </div>
        <div className='topbar-right'>
          <div className='platform-badges'>
            {platforms.map((p) => (
              <span key={p} className='badge'>
                {p}
              </span>
            ))}
          </div>
          <div className='avatar'>RK</div>
          <button className='secondary-btn' onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <aside className='sidebar'>
        <div className='profile-card'>
          <div className='profile-avatar'>RK</div>
          <div className='profile-name'>Rohit Kumar</div>
          <div className='profile-meta'>LNCT Bhopal · CS — 2026</div>
          <div className='profile-rank'>🏆 Rank 4,821</div>
        </div>

        <div className='streak-widget'>
          <div className='streak-label'>🔥 Current Streak</div>
          <div className='streak-main'>{summary.streak} days</div>
        </div>

        <div className='mastery-list'>
          {topicMastery.map((topic) => (
            <div key={topic.name} className='mastery-item'>
              <div className='mastery-header'>
                <span>{topic.name}</span>
                <span>{topic.pct}%</span>
              </div>
              <div className='mastery-bar'>
                <div className='mastery-fill' style={{ width: `${topic.pct}%`, background: masteryColor(topic.pct) }} />
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main className='main'>
        <div>
          <h1 className='page-title'>Good evening, <span>Rohit</span> 👋</h1>
          <p className='muted'>{dateLabel} · Keep the streak alive!</p>
        </div>

        <section className='stats-row'>
          <div className='stat-card'>
            <h3>Total Solved</h3>
            <p>{summary.total_questions_solved}</p>
          </div>
          <div className='stat-card'>
            <h3>Easy</h3>
            <p>{summary.easy}</p>
          </div>
          <div className='stat-card'>
            <h3>Medium</h3>
            <p>{summary.medium}</p>
          </div>
          <div className='stat-card'>
            <h3>Hard</h3>
            <p>{summary.hard}</p>
          </div>
        </section>

        <section className='section-card'>
          <h2>Recently Solved</h2>
          <div className='q-list'>
            {recentQuestions.map((q) => (
              <div key={q.name} className='q-item'>
                <span className={`q-diff ${q.diff}`} />
                <span className='q-name'>{q.name}</span>
                <span className='q-topic'>{q.topic}</span>
                <span className='q-time'>{q.time}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
