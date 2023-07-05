import React, { CSSProperties} from 'react'
import { observer } from 'mobx-react-lite'
import Login from './Login'
import Announcements from './Announcements'
import Events from './Events'
import Map from './Map'
import Info from './Info'
import Profile from './Profile'
import { useAutorun, windowSize } from '../mobx-utils'
import Store from '../Store'
import Spacer from './core/Spacer'

const LOGGED_IN = true


export default observer(() => {
    useAutorun(() => {
        const root = document.getElementById('root')
        if (root != null) {
            root.style.height = windowSize.get().height + 'px'
        }
    })


    if (!LOGGED_IN) {
        return (
            <Login />
        )
    } else {

        return (
            <>
                <div className='stripes' style={{ transform: 'scale(-1) rotate(-20deg)', top: 'auto', left: 'auto', bottom: 50, right: '-100vw' }}>
                    <div></div>
                    <div></div>
                    <div></div>
                </div>

                <div className='viewsWrapper' style={{ '--view-count': VIEWS_ENTRIES.length, '--current-view': VIEWS_ENTRIES.findIndex(e => e[0] === Store.currentView) } as CSSProperties}>
                    <div>
                        {VIEWS_ENTRIES.map(([name, { component: Component }], index) =>
                            <div key={name}>
                                <Component />
                            </div>)}
                    </div>
                </div>

                <div className='nav'>
                    {VIEWS_ENTRIES.map(([name, { icon }], index) => (
                        <button className={name === Store.currentView ? 'active' : undefined} onClick={Store.setCurrentView(name)} title={name} key={index}>
                            <span className="material-symbols-outlined">{icon}</span>
                            <Spacer size={4} />
                            <span style={{ fontSize: 8 }}>{name}</span>
                        </button>
                    ))}
                </div>
            </>
        )
    }
})

const VIEWS = {
    Announcements: {
        icon: 'campaign',
        component: Announcements
    },
    Events: {
        icon: 'calendar_today',
        component: Events
    },
    Map: {
        icon: 'map',
        component: Map
    },
    Info: {
        icon: 'info',
        component: Info
    },
    Profile: {
        icon: 'person',
        component: Profile
    }
} as const

const VIEWS_ENTRIES = Object.entries(VIEWS) as [ViewName, typeof VIEWS[ViewName]][]

export type ViewName = keyof typeof VIEWS