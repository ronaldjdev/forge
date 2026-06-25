import { useEffect, useState } from 'react'
import { Button } from './ui/Button'

export function StarButton() {
  const [stars, setStars] = useState<number | null>(null)

  useEffect(() => {
    fetch('https://api.github.com/repos/ronaldjdev/forge')
      .then((res) => res.json())
      .then((data) => setStars(data.stargazers_count))
      .catch(() => setStars(null))
  }, [])

  return (
    <Button
      variant="ghost"
      href="https://github.com/ronaldjdev/forge"
      target="_blank"
      rel="noopener noreferrer"
      className="px-5 py-3 text-base"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
      <span>Star</span>
      {stars !== null && (
        <span className="text-sm opacity-70">{stars.toLocaleString()}</span>
      )}
    </Button>
  )
}
