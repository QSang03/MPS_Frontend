'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react'

export default function TokenTestPage() {
  const [testResults, setTestResults] = useState<
    Array<{
      test: string
      status: 'success' | 'error' | 'pending'
      message: string
      timestamp: Date
    }>
  >([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (test: string, status: 'success' | 'error' | 'pending', message: string) => {
    setTestResults((prev) => [...prev, { test, status, message, timestamp: new Date() }])
  }

  const testNormalRequest = async () => {
    setIsLoading(true)
    addResult('Normal Request', 'pending', 'Making authenticated request to /users...')

    try {
      const response = await fetch('/api/test-auth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        await response.json()
        addResult('Normal Request', 'success', `Request successful! Status: ${response.status}`)
      } else {
        addResult('Normal Request', 'error', `Request failed with status: ${response.status}`)
      }
    } catch (error) {
      addResult(
        'Normal Request',
        'error',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const testWithExpiredToken = async () => {
    setIsLoading(true)
    addResult('Expired Token Test', 'pending', 'Simulating expired token scenario...')

    try {
      // This will trigger a 401, which should automatically refresh the token
      const response = await fetch('/api/test-auth?simulate=expired', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        addResult('Expired Token Test', 'success', 'Token was refreshed automatically!')
      } else {
        addResult('Expired Token Test', 'error', `Failed with status: ${response.status}`)
      }
    } catch (error) {
      addResult(
        'Expired Token Test',
        'error',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const manualRefresh = async () => {
    setIsLoading(true)
    addResult('Manual Refresh', 'pending', 'Calling refresh token endpoint...')

    try {
      const response = await fetch('/api/refresh-token', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        addResult(
          'Manual Refresh',
          'success',
          `Token refreshed! New token length: ${'accessToken' in data ? data.accessToken?.length || 'N/A' : 'N/A'}`
        )
      } else {
        addResult('Manual Refresh', 'error', `Refresh failed with status: ${response.status}`)
      }
    } catch (error) {
      addResult(
        'Manual Refresh',
        'error',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    } finally {
      setIsLoading(false)
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="w-full p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-6 w-6" />
            Token Refresh Test Page
          </CardTitle>
          <CardDescription>
            Test access token refresh functionality when tokens expire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Buttons */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Button
              onClick={testNormalRequest}
              disabled={isLoading}
              variant="default"
              className="w-full"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Normal Request
            </Button>

            <Button
              onClick={testWithExpiredToken}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <Clock className="mr-2 h-4 w-4" />
              Test Expired Token
            </Button>

            <Button
              onClick={manualRefresh}
              disabled={isLoading}
              variant="secondary"
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Manual Refresh
            </Button>
          </div>

          <Button onClick={clearResults} variant="secondary" size="sm" className="w-full">
            Clear Results
          </Button>

          {/* Test Results */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Test Results:</h3>

            {testResults.length === 0 && (
              <Alert>
                <AlertDescription>
                  No tests run yet. Click a button above to start testing.
                </AlertDescription>
              </Alert>
            )}

            {testResults.map((result, index) => (
              <Alert
                key={index}
                variant={result.status === 'error' ? 'destructive' : 'default'}
                className={
                  result.status === 'success'
                    ? 'border-[var(--color-success-200)] bg-[var(--color-success-50)] text-[var(--color-success-600)]'
                    : result.status === 'pending'
                      ? 'border-[var(--brand-200)] bg-[var(--brand-50)] text-[var(--brand-900)]'
                      : ''
                }
              >
                <div className="flex items-start gap-2">
                  {result.status === 'success' && <CheckCircle className="mt-0.5 h-4 w-4" />}
                  {result.status === 'error' && <XCircle className="mt-0.5 h-4 w-4" />}
                  {result.status === 'pending' && (
                    <Clock className="mt-0.5 h-4 w-4 animate-pulse" />
                  )}

                  <div className="flex-1">
                    <div className="font-semibold">{result.test}</div>
                    <AlertDescription className="mt-1">{result.message}</AlertDescription>
                    <div className="mt-1 text-xs opacity-60">
                      {result.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>

          {/* Instructions */}
          <div className="space-y-2 border-t pt-6">
            <h3 className="text-lg font-semibold">How it works:</h3>
            <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
              <li>
                <strong>Normal Request:</strong> Makes a regular authenticated API call
              </li>
              <li>
                <strong>Test Expired Token:</strong> Simulates an expired token scenario (should
                trigger auto-refresh)
              </li>
              <li>
                <strong>Manual Refresh:</strong> Directly calls the refresh token endpoint
              </li>
            </ul>

            <div className="mt-4 rounded-lg border border-[var(--brand-200)] bg-[var(--brand-50)] p-4">
              <p className="text-sm">
                <strong>Expected behavior:</strong> When your access token expires (after 15
                minutes), any API request that receives a 401 response will automatically attempt to
                refresh the token using your refresh token. The original request will then be
                retried with the new token.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
