import { useCallback, useMemo } from 'react'

import { PASSWORD_RESET_SECRET_KEY } from '../../../back-end/utils/constants'
import { jsonParse } from '../utils'
import useLocationHash from './useLocationHash'

export default function useHashState() {
    const hash = useLocationHash()

    const hashState = useMemo(() => {
        const parsed = jsonParse(decodeURIComponent(hash.substring(1)))

        if (parsed == null || typeof parsed !== 'object') {
            return undefined
        }

        for (const key in parsed) {
            if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'boolean' && key !== null) {
                return undefined
            }
        }

        return parsed as HashState
    }, [hash])

    const getHashStateString = useCallback((state: HashState) => {
        return encodeURIComponent(JSON.stringify({ ...hashState, ...state }))
    }, [hashState])

    const setHashState = useCallback((state: HashState) => {
        window.location.hash = getHashStateString(state)
    }, [getHashStateString])

    return { hashState, setHashState, getHashStateString } as const
}

type HashState = Readonly<{
    currentView?: string | number | boolean | null,
    ticketPurchaseModalState?: string | number | boolean | null,
    applicationModalOpen?: string | number | boolean | null,
    eventsFilter?: string | number | boolean | null,
    viewingEventDetails?: string | number | boolean | null,
    compactEventsView?: string | number | boolean | null,
    [PASSWORD_RESET_SECRET_KEY]?: string | number | boolean | null
}>
