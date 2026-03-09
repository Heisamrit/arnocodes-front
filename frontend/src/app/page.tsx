'use client'

import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { apiFetch } from '@/lib/api'

type Endpoint = {
  name: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  path: string
  body?: Record<string, unknown>
  note?: string
}

const ENDPOINTS: Endpoint[] = [
  { name: 'Health', method: 'GET', path: '/api/v1/health' },
  { name: 'My Profile', method: 'GET', path: '/api/v1/profiles/me' },
  { name: 'Update Profile', method: 'PATCH', path: '/api/v1/profiles/me', body: { full_name: 'Jane Dev' } },
  { name: 'Profile Status', method: 'GET', path: '/api/v1/profiles/me/status' },
  { name: 'Platform Connections', method: 'GET', path: '/api/v1/profiles/me/platform-connections' },
  {
    name: 'Add Platform Connection',
    method: 'POST',
    path: '/api/v1/profiles/me/platform-connections',
    body: { platform: 'leetcode', handle: 'your_handle' },
  },
  { name: 'Remove Platform Connection', method: 'DELETE', path: '/api/v1/profiles/me/platform-connections/{platform}' },
  { name: 'Dashboard Summary', method: 'GET', path: '/api/v1/dashboard/summary' },
  { name: 'Dashboard Full', method: 'GET', path: '/api/v1/dashboard' },
  { name: 'Dashboard Heatmap', method: 'GET', path: '/api/v1/dashboard/heatmap?from=2025-01-01&to=2025-12-31' },
  { name: 'Course', method: 'GET', path: '/api/v1/course' },
  { name: 'Course Structure', method: 'GET', path: '/api/v1/course/structure' },
  { name: 'Topic Details', method: 'GET', path: '/api/v1/topics/{topicId}' },
  { name: 'Subtopic Details', method: 'GET', path: '/api/v1/subtopics/{subtopicId}' },
  {
    name: 'Start Diagnostic',
    method: 'POST',
    path: '/api/v1/diagnostic/start',
    body: { topic: 'arrays', source: 'dashboard' },
  },
  { name: 'Diagnostic Next', method: 'GET', path: '/api/v1/diagnostic/{attemptId}/next' },
  {
    name: 'Diagnostic Answer',
    method: 'POST',
    path: '/api/v1/diagnostic/{attemptId}/answer',
    body: { question_id: 'uuid', answer: 'A' },
  },
  { name: 'Diagnostic Status', method: 'GET', path: '/api/v1/diagnostic/{attemptId}/status' },
  { name: 'Diagnostic Submit', method: 'POST', path: '/api/v1/diagnostic/{attemptId}/submit' },
  { name: 'Platform Sync Trigger', method: 'POST', path: '/api/v1/platform-sync/trigger' },
  { name: 'Platform Sync Job', method: 'GET', path: '/api/v1/platform-sync/jobs/{jobId}' },
  { name: 'Platform Sync Overview', method: 'GET', path: '/api/v1/platform-sync/overview' },
  {
    name: 'IDE Run',
    method: 'POST',
    path: '/api/v1/ide/run',
    body: { question_id: 'uuid', language: 'python', code: 'print("hello")' },
  },
  {
    name: 'IDE Submit',
    method: 'POST',
    path: '/api/v1/ide/submit',
    body: { question_id: 'uuid', language: 'python', code: 'print(input())' },
  },
  { name: 'IDE Status', method: 'GET', path: '/api/v1/ide/status?id={submissionId}' },
  {
    name: 'AI Query',
    method: 'POST',
    path: '/api/v1/ai/query',
    body: { prompt: 'Explain two pointer approach' },
  },
]

export default function Home() {
  const [selected, setSelected] = useState<Endpoint>(ENDPOINTS[0])
  const [path, setPath] = useState(selected.path)
  const [body, setBody] = useState(JSON.stringify(selected.body ?? {}, null, 2))
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const grouped = useMemo(() => {
    const map = new Map<string, Endpoint[]>()
    ENDPOINTS.forEach((ep) => {
      const bucket = ep.path.split('/')[3] || 'misc'
      map.set(bucket, [...(map.get(bucket) ?? []), ep])
    })
    return Array.from(map.entries())
  }, [])

  const selectEndpoint = (endpoint: Endpoint) => {
    setSelected(endpoint)
    setPath(endpoint.path)
    setBody(JSON.stringify(endpoint.body ?? {}, null, 2))
    setResult('')
  }

  const runEndpoint = async () => {
    setLoading(true)
    setResult('')
    try {
      const payload = body.trim() ? JSON.parse(body) : undefined
      const response = await apiFetch(path, {
        method: selected.method,
        body: selected.method === 'GET' || selected.method === 'DELETE' ? undefined : JSON.stringify(payload ?? {}),
      })
      const text = await response.text()
      const pretty = (() => {
        try {
          return JSON.stringify(JSON.parse(text), null, 2)
        } catch {
          return text
        }
      })()
      setResult(`HTTP ${response.status}\n\n${pretty}`)
    } catch (error) {
      setResult(`Request failed: ${String(error)}`)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <main className='page'>
      <section className='hero'>
        <h1>ArnoCodes API Command Center</h1>
        <p>Creative dashboard to explore all major backend endpoints from one modern interface.</p>
        <button className='secondary-btn' onClick={logout}>Logout</button>
      </section>

      <section className='dashboard-grid'>
        <aside className='panel'>
          <h2>Endpoint Catalog</h2>
          {grouped.map(([group, endpoints]) => (
            <div key={group} className='endpoint-group'>
              <h3>{group.toUpperCase()}</h3>
              {endpoints.map((ep) => (
                <button
                  key={`${ep.method}-${ep.path}`}
                  className={`endpoint-item ${selected.path === ep.path ? 'active' : ''}`}
                  onClick={() => selectEndpoint(ep)}
                >
                  <span className={`pill ${ep.method.toLowerCase()}`}>{ep.method}</span>
                  <span>{ep.name}</span>
                </button>
              ))}
            </div>
          ))}
        </aside>

        <section className='panel'>
          <h2>API Playground</h2>
          <label>Path</label>
          <input value={path} onChange={(e) => setPath(e.target.value)} placeholder='/api/v1/...' />

          <label>Body (JSON)</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={10} />

          <button className='primary-btn' onClick={runEndpoint} disabled={loading}>
            {loading ? 'Running...' : `Run ${selected.method}`}
          </button>

          <pre className='result'>{result || 'Run an endpoint to see response...'}</pre>
        </section>
      </section>
    </main>
  )
}
