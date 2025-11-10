import { useEffect } from 'react'
import { useUIStore } from '@/lib/store/uiStore'

// Small helper hook so pages can declaratively set the global header title
export function usePageTitle(title: string) {
  const setPageTitle = useUIStore((s) => s.setPageTitle)

  useEffect(() => {
    setPageTitle(title)
    return () => setPageTitle('')
  }, [title, setPageTitle])
}
