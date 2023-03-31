import { useEffect, useState } from 'react'
import { AssignmentIn, ExamType } from '../../types'

export function useAssignments(examType: ExamType) {
  const [assignments, setAssignments] = useState<AssignmentIn[]>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refresh, setRefresh] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/assignment/${examType}`, { method: 'GET' })
        const json = await response.json()
        setAssignments(json)
      } catch (e) {
        setError('error')
        console.error('could not fetch tasks', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [refresh])

  return {
    assignments,
    loading,
    error,
    refresh: () => setRefresh(!refresh)
  }
}
