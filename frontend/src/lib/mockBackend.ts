const nowISO = () => new Date().toISOString()

const fakeAttemptId = '11111111-1111-1111-1111-111111111111'
const fakeSubmissionId = '66666666-6666-6666-6666-666666666666'
const fakeJobId = '77777777-7777-7777-7777-777777777777'

type MockResponse = { status: number; body: unknown }

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const ok = (message: string, data?: unknown): MockResponse => ({ status: 200, body: { status: 'ok', message, data } })
const accepted = (message: string, data?: unknown): MockResponse => ({ status: 202, body: { status: 'ok', message, data } })
const created = (message: string, data?: unknown): MockResponse => ({ status: 201, body: { status: 'ok', message, data } })

const platformConnections = [
  { platform: 'leetcode', handle: 'rohit_lc', connected_at: nowISO() },
  { platform: 'gfg', handle: 'rohit_gfg', connected_at: nowISO() },
  { platform: 'codeforces', handle: 'rohit_cf', connected_at: nowISO() },
]

export async function mockApiFetch(path: string, init: RequestInit = {}) {
  const method = (init.method ?? 'GET').toUpperCase()
  const url = new URL(path, 'http://localhost')
  const normalizedPath = url.pathname

  let payload: Record<string, unknown> = {}
  if (init.body && typeof init.body === 'string') {
    try {
      payload = JSON.parse(init.body) as Record<string, unknown>
    } catch {
      return json(400, { status: 'error', message: 'invalid request body' })
    }
  }

  let mock: MockResponse | null = null

  if (method === 'GET' && (normalizedPath === '/health' || normalizedPath === '/api/v1/health')) {
    mock = ok('healthy', { service: 'mock-backend', time: nowISO() })
  }

  // Profile
  else if (method === 'GET' && normalizedPath === '/api/v1/profiles/me') {
    mock = ok('profile', { id: 'mock-user-id', email: 'rohit@example.com', full_name: 'Rohit Kumar' })
  } else if (method === 'PATCH' && normalizedPath === '/api/v1/profiles/me') {
    mock = accepted('profile updated', payload)
  } else if (method === 'GET' && normalizedPath === '/api/v1/profiles/me/status') {
    mock = ok('profile status', { user_id: 'mock-user-id', diagnostic_completed: true, streak_days: 23 })
  } else if (method === 'GET' && normalizedPath === '/api/v1/profiles/me/platform-connections') {
    mock = ok('platform connections', platformConnections)
  } else if (method === 'POST' && normalizedPath === '/api/v1/profiles/me/platform-connections') {
    mock = accepted('platform connected', {
      platform: String(payload.platform ?? 'leetcode'),
      handle: String(payload.handle ?? 'demo_handle'),
      connected_at: nowISO(),
    })
  } else if (method === 'DELETE' && normalizedPath.startsWith('/api/v1/profiles/me/platform-connections/')) {
    mock = accepted('platform disconnected', { platform: normalizedPath.split('/').at(-1) })
  }

  // Dashboard
  else if (method === 'GET' && normalizedPath === '/api/v1/dashboard') {
    mock = ok('dashboard', {
      profile: { rank: 4821, name: 'Rohit Kumar' },
      summary: { total: 347, easy: 182, medium: 134, hard: 31, streak: 23 },
    })
  } else if (method === 'GET' && normalizedPath === '/api/v1/dashboard/summary') {
    mock = ok('dashboard summary', {
      total_questions_solved: 347,
      easy: 182,
      medium: 134,
      hard: 31,
      streak: 23,
      weekly_goal_progress: 74,
      recent_activity: [
        { day: 'Mon', solved: 4 },
        { day: 'Tue', solved: 6 },
        { day: 'Wed', solved: 3 },
        { day: 'Thu', solved: 5 },
      ],
    })
  } else if (method === 'GET' && normalizedPath === '/api/v1/dashboard/heatmap') {
    mock = ok('dashboard heatmap', {
      from: url.searchParams.get('from') ?? '2025-03-01',
      to: url.searchParams.get('to') ?? '2026-03-20',
      points: Array.from({ length: 40 }).map((_, idx) => ({ date: `2026-02-${String((idx % 28) + 1).padStart(2, '0')}`, count: idx % 5 })),
    })
  } else if (method === 'GET' && normalizedPath === '/api/v1/dashboard/leaderboards') {
    mock = ok('dashboard leaderboard endpoint placeholder', [{ rank: 1, user: 'alice', score: 820 }])
  }

  // Course
  else if (method === 'GET' && normalizedPath === '/api/v1/course') {
    mock = ok('course', {
      topics: [
        { id: 'arrays', name: 'Arrays', unlock_state: 'unlocked', mastery_score: 88 },
        { id: 'dp', name: 'Dynamic Programming', unlock_state: 'locked', mastery_score: 38 },
      ],
    })
  } else if (method === 'GET' && /^\/api\/v1\/course\/topic\/.+/.test(normalizedPath)) {
    mock = ok('topic', { topic_id: normalizedPath.split('/').at(-1), unlock_state: 'unlocked' })
  } else if (method === 'GET' && /^\/api\/v1\/course\/subtopic\/.+/.test(normalizedPath)) {
    mock = ok('subtopic', { subtopic_id: normalizedPath.split('/').at(-1), unlock_state: 'unlocked' })
  } else if (method === 'GET' && normalizedPath === '/api/v1/topics') {
    mock = ok('topics list endpoint placeholder', [])
  } else if (method === 'GET' && /^\/api\/v1\/topics\/[^/]+$/.test(normalizedPath)) {
    mock = ok('topic details endpoint placeholder', { topic_id: normalizedPath.split('/').at(-1) })
  } else if (method === 'GET' && /^\/api\/v1\/topics\/[^/]+\/unlock-status$/.test(normalizedPath)) {
    mock = ok('topic unlock status endpoint placeholder', { status: 'unlocked' })
  } else if (method === 'GET' && /^\/api\/v1\/subtopics\/[^/]+$/.test(normalizedPath)) {
    mock = ok('subtopic details endpoint placeholder', { subtopic_id: normalizedPath.split('/').at(-1) })
  } else if (method === 'POST' && /^\/api\/v1\/subtopics\/[^/]+\/complete$/.test(normalizedPath)) {
    mock = accepted('subtopic completion accepted; pending server validation')
  } else if (method === 'POST' && /^\/api\/v1\/learning\/questions\/[^/]+\/complete$/.test(normalizedPath)) {
    mock = accepted('complete learning question endpoint placeholder')
  }

  // Diagnostic
  else if (method === 'POST' && normalizedPath === '/api/v1/diagnostic/start') {
    mock = created('diagnostic attempt started', { attempt_id: fakeAttemptId })
  } else if (method === 'GET' && /^\/api\/v1\/diagnostic\/.+\/next$/.test(normalizedPath)) {
    mock = ok('next diagnostic question', {
      question_id: 'q1',
      question_type: 'mcq',
      prompt: 'What is complexity of binary search?',
      options: ['O(log n)', 'O(n)', 'O(1)', 'O(n log n)'],
    })
  } else if (method === 'POST' && /^\/api\/v1\/diagnostic\/.+\/(answer|coding)$/.test(normalizedPath)) {
    mock = accepted('diagnostic answer accepted', { accepted: 'true', submission_id: fakeSubmissionId })
  } else if (method === 'GET' && /^\/api\/v1\/diagnostic\/.+\/status$/.test(normalizedPath)) {
    mock = ok('diagnostic status', { attempt_id: fakeAttemptId, progress: { answered: 8, total: 10 }, state: 'in_progress' })
  } else if (method === 'POST' && /^\/api\/v1\/diagnostic\/.+\/submit$/.test(normalizedPath)) {
    mock = accepted('diagnostic submitted')
  }

  // Platform sync
  else if (method === 'POST' && normalizedPath === '/api/v1/platform-sync/trigger') {
    mock = accepted('platform sync trigger accepted', { job_id: fakeJobId })
  } else if (method === 'GET' && normalizedPath === '/api/v1/platform-sync/overview') {
    mock = ok('platform sync overview', {
      status_counts: { queued: 0, running: 1, completed: 12, failed: 1 },
      recent_jobs: [{ id: fakeJobId, status: 'completed', created_at: nowISO() }],
      latest_error: null,
    })
  } else if (method === 'GET' && /^\/api\/v1\/platform-sync\/jobs\/.+/.test(normalizedPath)) {
    mock = ok('platform sync job', { id: normalizedPath.split('/').at(-1), status: 'completed', started_at: nowISO(), finished_at: nowISO() })
  }

  // IDE
  else if (method === 'POST' && normalizedPath === '/api/v1/ide/run') {
    mock = ok('sample run result', { verdict: 'passed', stdout: '1\n', execution_ms: 26 })
  } else if (method === 'POST' && normalizedPath === '/api/v1/ide/submit') {
    mock = accepted('submission queued', { submission_id: fakeSubmissionId })
  } else if (method === 'GET' && normalizedPath === '/api/v1/ide/status') {
    mock = ok('submission status', {
      submission_id: url.searchParams.get('id') ?? fakeSubmissionId,
      evaluation_status: 'completed',
      verdict: 'accepted',
    })
  }

  // AI + internal
  else if (method === 'POST' && normalizedPath === '/api/v1/ai/query') {
    mock = accepted('ai query endpoint placeholder', { answer: 'Try two pointers for sorted array pair constraints.' })
  } else if (method === 'POST' && normalizedPath === '/api/v1/ai/code-helper/step') {
    mock = accepted('ai code helper step endpoint placeholder', { step: 'Break problem into base case and recurrence.' })
  } else if (method === 'GET' && normalizedPath === '/api/v1/ai/usage') {
    mock = ok('ai usage endpoint placeholder', { used_tokens: 1200, remaining_tokens: 8800 })
  } else if (method === 'GET' && normalizedPath === '/api/v1/internal/api-catalog') {
    mock = ok('api catalog', { total_endpoints: 42 })
  } else if (method === 'POST' && normalizedPath === '/api/v1/internal/api-smoke-check') {
    mock = ok('api smoke check completed', { passed: true })
  } else if (method === 'POST' && normalizedPath === '/api/v1/internal/recompute-dashboard') {
    mock = accepted('internal recompute dashboard endpoint placeholder')
  } else if (method === 'POST' && normalizedPath === '/api/v1/internal/refresh-leaderboard') {
    mock = accepted('internal refresh leaderboard endpoint placeholder')
  }

  if (!mock) {
    mock = {
      status: 404,
      body: { status: 'error', message: `No mock is configured for ${method} ${normalizedPath}` },
    }
  }

  return json(mock.status, mock.body)
}
