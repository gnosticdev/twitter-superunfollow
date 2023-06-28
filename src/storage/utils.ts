import { $following } from './persistent'

export const getLastFollowingEntry = () => {
    const following = $following.get()
    const lastEntry = [...following.entries()].pop()
    return lastEntry
}
