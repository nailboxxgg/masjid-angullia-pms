import { describe, it, expect } from 'vitest'
import { formatTimeAgo } from '../utils'

describe('formatTimeAgo', () => {
    it('returns "Just now" for current time', () => {
        const now = new Date()
        expect(formatTimeAgo(now)).toBe('Just now')
    })

    it('returns minutes for recent time', () => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        expect(formatTimeAgo(fiveMinutesAgo)).toBe('5m ago')
    })

    it('returns hours for time within a day', () => {
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000)
        expect(formatTimeAgo(threeHoursAgo)).toBe('3h ago')
    })

    it('returns days for time within a week', () => {
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        expect(formatTimeAgo(twoDaysAgo)).toBe('2d ago')
    })
})
