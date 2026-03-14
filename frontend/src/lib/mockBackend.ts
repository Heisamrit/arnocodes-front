const nowISO = () => new Date().toISOString()

const fakeAttemptId = '11111111-1111-1111-1111-111111111111'
const fakeSubmissionId = '66666666-6666-6666-6666-666666666666'
const fakeJobId = '77777777-7777-7777-7777-777777777777'

type MockResponse = {
  status: number
  body: unknown
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function ok(message: string, data?: unknown): MockResponse {
  return { status: 200, body: { status: 'ok', message, data } }
}

function accepted(message: string, data?: unknown): MockResponse {
  return { status: 202, body: { status: 'ok', message, data } }
}

function created(message: string, data?: unknown): MockResponse {
  return { status: 201, body: { status: 'ok', message, data } }
}

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
  } else if (method === 'GET' && normalizedPath === '/api/v1/profiles/me') {
    mock = ok('profile', { id: 'mock-user-id', email: 'demo@arnocodes.dev', full_name: 'Demo User' })
  } else if (method === 'PATCH' && normalizedPath === '/api/v1/profiles/me') {
    mock = accepted('profile update endpoint placeholder', payload)
  } else if (method === 'GET' && normalizedPath === '/api/v1/profiles/me/status') {
    mock = ok('profile status', { diagnostic_completed: true, streak_days: 6, user_id: 'mock-user-id' })
  } else if (method === 'GET' && normalizedPath === '/api/v1/profiles/me/platform-connections') {
    mock = ok('platform connections', [
      { platform: 'leetcode', handle: 'mock_handle', connected_at: nowISO() },
      { platform: 'codeforces', handle: 'mock_cf', connected_at: nowISO() },
    ])
  } else if (method === 'POST' && normalizedPath === '/api/v1/profiles/me/platform-connections') {
    mock = accepted('platform connected', {
      platform: String(payload.platform ?? 'leetcode'),
      handle: String(payload.handle ?? 'mock_handle'),
      connected_at: nowISO(),
    })
  } else if (method === 'DELETE' && normalizedPath.startsWith('/api/v1/profiles/me/platform-connections/')) {
    mock = accepted('platform disconnected', { platform: normalizedPath.split('/').at(-1) })
  } else if (method === 'GET' && normalizedPath === '/api/v1/dashboard/summary') {
    mock = ok('dashboard summary', {
      total_questions_solved: 124,
      weekly_goal_progress: 72,
      recent_activity: [
        { day: 'Mon', solved: 8 },
        { day: 'Tue', solved: 12 },
      ],
    })
  } else if (method === 'GET' && normalizedPath === '/api/v1/dashboard') {
    mock = ok('dashboard', {
      profile: { level: 'intermediate', rank: 314 },
      summary: { solved: 124, streak: 6 },
    })
  } else if (method === 'GET' && normalizedPath === '/api/v1/dashboard/heatmap') {
    mock = ok('dashboard heatmap', {
      from: url.searchParams.get('from'),
      to: url.searchParams.get('to'),
      points: [
        { date: '2025-01-01', count: 3 },
        { date: '2025-01-02', count: 5 },
      ],
    })
  } else if (method === 'GET' && normalizedPath === '/api/v1/course') {
    mock = ok('course', {
      topics: [
        { id: 'topic-arrays', name: 'Arrays', unlock_state: 'unlocked' },
        { id: 'topic-dp', name: 'Dynamic Programming', unlock_state: 'locked' },
      ],
    })
  } else if (method === 'GET' && normalizedPath === '/api/v1/course/structure') {
    mock = ok('course structure', {
      roots: ['Arrays'],
      edges: [{ from: 'Arrays', to: 'Two Pointers' }],
    })
  } else if (method === 'GET' && /^\/api\/v1\/topics\/.+/.test(normalizedPath)) {
    mock = ok('topic details endpoint placeholder', {
      topic_id: normalizedPath.split('/').at(-1),
      status: 'unlocked',
    })
  } else if (method === 'GET' && /^\/api\/v1\/subtopics\/.+/.test(normalizedPath)) {
    mock = ok('subtopic details endpoint placeholder', {
      subtopic_id: normalizedPath.split('/').at(-1),
      status: 'unlocked',
    })
  } else if (method === 'POST' && normalizedPath === '/api/v1/diagnostic/start') {
    mock = created('diagnostic attempt started', { attempt_id: fakeAttemptId })
  } else if (method === 'GET' && /^\/api\/v1\/diagnostic\/.+\/next$/.test(normalizedPath)) {
    mock = ok('next diagnostic question', {
      question_id: 'question-1',
      question_type: 'mcq',
      prompt: 'What is time complexity of binary search?',
      options: ['O(log n)', 'O(n)', 'O(1)', 'O(n log n)'],
    })
  } else if (method === 'POST' && /^\/api\/v1\/diagnostic\/.+\/(answer|coding)$/.test(normalizedPath)) {
    mock = accepted('diagnostic answer accepted', { accepted: 'true', submission_id: fakeSubmissionId })
  } else if (method === 'GET' && /^\/api\/v1\/diagnostic\/.+\/status$/.test(normalizedPath)) {
    mock = ok('diagnostic status', {
      attempt_id: fakeAttemptId,
      progress: { answered: 4, total: 10 },
      state: 'in_progress',
    })
  } else if (method === 'POST' && /^\/api\/v1\/diagnostic\/.+\/submit$/.test(normalizedPath)) {
    mock = accepted('diagnostic submitted')
  } else if (method === 'POST' && normalizedPath === '/api/v1/platform-sync/trigger') {
    mock = accepted('platform sync trigger accepted', { job_id: fakeJobId })
  } else if (method === 'GET' && normalizedPath === '/api/v1/platform-sync/overview') {
    mock = ok('platform sync overview', {
      last_24h: { success: 3, failed: 0 },
      latest_error: null,
      recent_jobs: [{ id: fakeJobId, status: 'completed', created_at: nowISO() }],
    })
  } else if (method === 'GET' && /^\/api\/v1\/platform-sync\/jobs\/.+/.test(normalizedPath)) {
    mock = ok('platform sync job', {
      id: normalizedPath.split('/').at(-1),
      status: 'completed',
      started_at: nowISO(),
      finished_at: nowISO(),
    })
  } else if (method === 'POST' && normalizedPath === '/api/v1/ide/run') {
    mock = ok('sample run result', {
      verdict: 'passed',
      stdout: '1\n',
      execution_ms: 48,
    })
  } else if (method === 'POST' && normalizedPath === '/api/v1/ide/submit') {
    mock = accepted('submission queued', { submission_id: fakeSubmissionId })
  } else if (method === 'GET' && normalizedPath === '/api/v1/ide/status') {
    mock = ok('submission status', {
      submission_id: url.searchParams.get('id') ?? fakeSubmissionId,
      evaluation_status: 'completed',
      verdict: 'accepted',
    })
  } else if (method === 'POST' && normalizedPath === '/api/v1/ai/query') {
    mock = accepted('ai query endpoint placeholder', {
      answer: 'Use two pointers when the input is sorted and you need pair/triplet constraints.',
    })
  }

  if (!mock) {
    mock = {
      status: 404,
      body: {
        status: 'error',
        message: `No mock is configured for ${method} ${normalizedPath}`,
      },
    }
  }

  return json(mock.status, mock.body)
}
