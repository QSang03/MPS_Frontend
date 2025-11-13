'use client'

import { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugSessionPage() {
  const [sessionData, setSessionData] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const sessionCookie = Cookies.get('mps_session')
      if (sessionCookie) {
        const parts = sessionCookie.split('.')
        if (parts[1]) {
          const payload = JSON.parse(atob(parts[1]))
          // Avoid synchronous setState warning by deferring to next tick
          setTimeout(() => setSessionData(payload as Record<string, unknown>), 0)
        }
      } else {
        setTimeout(() => setError('No session cookie found'), 0)
      }
    } catch (err) {
      setTimeout(() => setError('Failed to parse session cookie: ' + (err as Error).message), 0)
    }
  }, [])

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Session Debug</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 text-red-600">
              <strong>Error:</strong> {error}
            </div>
          )}

          {sessionData && (
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 font-semibold">Session Data:</h3>
                <pre className="overflow-auto rounded bg-gray-100 p-4">
                  {JSON.stringify(sessionData, null, 2)}
                </pre>
              </div>

              <div className="border-t pt-4">
                <h3 className="mb-2 font-semibold">Key Values:</h3>
                <ul className="space-y-1">
                  <li>
                    <strong>userId:</strong>{' '}
                    {String((sessionData as Record<string, unknown>)['userId'] ?? '')}
                  </li>
                  <li>
                    <strong>email:</strong>{' '}
                    {String((sessionData as Record<string, unknown>)['email'] ?? '')}
                  </li>
                  <li>
                    <strong>role:</strong>{' '}
                    {String((sessionData as Record<string, unknown>)['role'] ?? '')}
                  </li>
                  <li>
                    <strong>customerId:</strong>{' '}
                    {String((sessionData as Record<string, unknown>)['customerId'] ?? '')}
                  </li>
                  <li>
                    <strong>isDefaultPassword:</strong>{' '}
                    {String((sessionData as Record<string, unknown>)['isDefaultPassword'] ?? '')}
                  </li>
                  <li>
                    <strong>isDefaultCustomer:</strong>{' '}
                    {String((sessionData as Record<string, unknown>)['isDefaultCustomer'] ?? '')}
                  </li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
