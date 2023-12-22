import dayjs, { Dayjs } from 'dayjs'
import React, { FC } from 'react'

import { TABLE_ROWS, Tables } from '../../../back-end/types/db-types'
import { useObservableClass } from '../mobx/hooks'
import { observer, setter } from '../mobx/misc'
import { request } from '../mobx/request'
import Store from '../stores/Store'
import { fieldProps,preventingDefault, someValue, validate } from '../utils'
import { vibefetch } from '../vibefetch'
import Button from './core/Button'
import Col from './core/Col'
import DateField, { formatNoTimezone } from './core/DateField'
import Icon from './core/Icon'
import InfoBlurb from './core/InfoBlurb'
import Input from './core/Input'
import LoadingDots from './core/LoadingDots'
import Modal from './core/Modal'
import RadioGroup from './core/RadioGroup'
import Row from './core/Row'
import RowSelect from './core/RowSelect'
import Spacer from './core/Spacer'

type InProgressEvent = {
    event_id: string | undefined,
    name: string,
    description: string,
    start_datetime: Dayjs | null,
    end_datetime: Dayjs | null,
    plaintext_location: string | null,
    event_site_location: Tables['event_site']['event_site_id'] | null
}

class EventsScreenState {
    eventBeingEdited: InProgressEvent | null = null
    showingEventErrors = false

    filter: 'All' | 'Bookmarked' | 'Mine' = 'All'

    get visibleEvents() {
        if (this.filter === 'All') {
            return Store.allEvents.state.result
        } else if (this.filter === 'Bookmarked') {
            return Store.allEvents.state.result?.filter(e => Store.bookmarks.state.result?.event_ids.includes(e.event_id))
        } else if (this.filter === 'Mine') {
            return Store.allEvents.state.result?.filter(e => e.created_by_account_id === Store.jwtPayload?.account_id)
        }
    }

    get eventErrors() {
        if (this.eventBeingEdited == null) {
            return {}
        }

        return validate(this.eventBeingEdited, {
            name: val => {
                if (val === '') {
                    return 'Please enter a name for the event'
                }
            },
            start_datetime: val => {
                if (val == null) {
                    return 'Please select a start date/time'
                }
            },
            end_datetime: val => {
                const start = this.eventBeingEdited?.start_datetime
                if (start != null && val != null && start >= val) {
                    return 'End date/time is before start date/time'
                }
            }
        })
    }

    readonly createNewEvent = () => {
        this.eventBeingEdited = {
            event_id: undefined,
            name: '',
            description: '',
            start_datetime: null,
            end_datetime: null,
            plaintext_location: null,
            event_site_location: null
        }
    }

    readonly editEvent = (eventId: string) => {
        const existing = Store.allEvents.state.result?.find(e => e.event_id === eventId)

        if (existing) {
            this.eventBeingEdited = { ...existing }
        }
    }

    readonly saveEvent = request(async () => {
        this.showingEventErrors = true
        if (this.eventBeingEdited == null || someValue(this.eventErrors, e => e != null)) {
            return
        }

        const { start_datetime, end_datetime } = this.eventBeingEdited

        await vibefetch(Store.jwt, '/event/save', 'post', {
            event: {
                ...this.eventBeingEdited,
                start_datetime: formatNoTimezone(start_datetime!),
                end_datetime: end_datetime && formatNoTimezone(end_datetime)
            }
        })
        await Store.allEvents.load()
        this.stopEditingEvent()
    }, { lazy: true })

    readonly stopEditingEvent = () => {
        this.eventBeingEdited = null
    }
}

export default observer(() => {
    const state = useObservableClass(EventsScreenState)

    const loading = Store.accountInfo.state.kind === 'loading' || Store.allEvents.state.kind === 'loading'
    const loadingOrError = loading || Store.accountInfo.state.kind === 'error'

    return (
        <Col padding={20} pageLevel justify={loadingOrError ? 'center' : undefined} align={loadingOrError ? 'center' : undefined}>
            {loading
                ? <LoadingDots size={100} color='var(--color-accent-1)' />
                : <>
                    <Row justify='space-between'>
                        <h1 style={{ fontSize: 24 }}>
                            Events
                        </h1>

                        {Store.purchasedTickets.length > 0 &&
                            <Button onClick={state.createNewEvent} isCompact style={{ width: 'auto' }}>
                                Create event

                                <Spacer size={8} />

                                <Icon name='calendar_add_on' />
                            </Button>}
                    </Row>

                    <Spacer size={8} />

                    <RowSelect
                        options={['All', 'Bookmarked', 'Mine']}
                        value={state.filter}
                        onChange={setter(state, 'filter')}
                    />

                    <Spacer size={8} />

                    {state.visibleEvents?.map(e =>
                        <Event event={e} editEvent={state.editEvent} key={e.event_id} />)}

                    <Modal isOpen={state.eventBeingEdited != null} onClose={state.stopEditingEvent}>
                        {() =>
                            state.eventBeingEdited != null &&
                                <EventEditor
                                    eventsScreenState={state}
                                />}
                    </Modal>
                </>}
        </Col>
    )
})

const Event: FC<{ event: Omit<Tables['event'], 'start_datetime' | 'end_datetime'> & { start_datetime: Dayjs, end_datetime: Dayjs | null, created_by: string, bookmarks: number }, editEvent: (eventId: string) => void }> = observer((props) => {
    const state = useObservableClass(class {
        get bookmarked() {
            return Store.bookmarks.state.result?.event_ids.includes(props.event.event_id)
        }

        get when() {
            const now = dayjs()
            const timeOnly = 'h:mma'
            const dateAndTime = (d: Dayjs) => (
                now.isSame(d, 'year')
                    ? 'ddd, M/D [at] ' + timeOnly
                    : 'ddd, M/D/YYYY [at] ' + timeOnly
            )

            if (props.event.end_datetime == null) {
                return props.event.start_datetime.format(dateAndTime(props.event.start_datetime))
            } else if (props.event.end_datetime.isSame(props.event.start_datetime, 'day')) {
                return props.event.start_datetime.format(dateAndTime(props.event.start_datetime)) + ' - ' + props.event.end_datetime.format(timeOnly)
            } else {
                return props.event.start_datetime.format(dateAndTime(props.event.start_datetime)) + ' - ' + props.event.end_datetime.format(dateAndTime(props.event.end_datetime))
            }
        }

        readonly unbookmarkEvent = request(async () => {
            await vibefetch(Store.jwt, '/event/unbookmark', 'post', { event_id: props.event.event_id })
            await Store.bookmarks.load()
        }, { lazy: true })

        readonly bookmarkEvent = request(async () => {
            await vibefetch(Store.jwt, '/event/bookmark', 'post', { event_id: props.event.event_id })
            await Store.bookmarks.load()
        }, { lazy: true })

        readonly toggleBookmark = async () => {
            if (this.bookmarked) {
                await this.unbookmarkEvent.load()
            } else {
                await this.bookmarkEvent.load()
            }
        }

        readonly editEvent = () => props.editEvent(props.event.event_id)
    })

    return (
        <div className={'card' + ' ' + 'eventCard' + ' ' + (props.event.created_by_account_id === '-1' ? 'official' : '')}>
            <div className='eventName'>
                <div>{props.event.name}</div>

                <div style={{ flexGrow: 1, flexShrink: 1 }}></div>

                {props.event.created_by_account_id === Store.accountInfo.state.result?.account_id &&
                    <Button onClick={state.editEvent} isCompact style={{ width: 'auto' }}>
                        Edit

                        <Spacer size={8} />

                        <Icon name='edit_calendar' style={{ fontSize: '1em' }} />
                    </Button>}

                <Spacer size={8} />

                <Button onClick={state.toggleBookmark} isCompact style={{ width: 'auto' }}>
                    <Icon name='star' fill={state.bookmarked ? 1 : 0} style={{ fontSize: '1em' }} />
                </Button>
            </div>

            <Spacer size={8} />

            <div className='info'>
                <Icon name='schedule' />
                <span>
                    {state.when}
                </span>
            </div>

            <Spacer size={4} />

            <div className='info'>
                <Icon name='location_on' />
                <span>
                    {props.event.plaintext_location || (props.event.event_site_location ? TABLE_ROWS['event_site'].find(s => s.event_site_id === props.event.event_site_location)?.name : null)}
                </span>
            </div>

            <Spacer size={4} />

            <div className='info'>
                <Icon name='person' />
                <span className='eventCreator'>
                    {props.event.created_by}
                </span>
            </div>

            <Spacer size={4} />

            <div className='info'>
                <Icon name='star'/>
                <span>
                    {props.event.bookmarks}
                </span>
            </div>

            <Spacer size={8} />

            <pre>
                {props.event.description}
            </pre>
        </div>
    )
})

const EventEditor = observer((props: { eventsScreenState: EventsScreenState }) => {
    const state = useObservableClass(class {
        locationType: 'At Vibeclipse' | 'Offsite' = 'At Vibeclipse'

        get isSaving() {
            return props.eventsScreenState.saveEvent.state.kind === 'loading'
        }
    })

    if (props.eventsScreenState.eventBeingEdited == null) {
        return null
    }

    const selectedSite = TABLE_ROWS['event_site'].find(site => site.event_site_id === props.eventsScreenState.eventBeingEdited?.event_site_location)

    return (
        <form onSubmit={preventingDefault(props.eventsScreenState.saveEvent.load)} noValidate>
            <Col padding={20} pageLevel>
                <Input
                    label='Event name'
                    disabled={state.isSaving}
                    {...fieldProps(
                        props.eventsScreenState.eventBeingEdited,
                        'name',
                        props.eventsScreenState.eventErrors,
                        props.eventsScreenState.showingEventErrors,
                    )}
                />

                <Spacer size={16} />

                <Input
                    label='Event description'
                    disabled={state.isSaving}
                    multiline
                    {...fieldProps(
                        props.eventsScreenState.eventBeingEdited,
                        'description',
                        props.eventsScreenState.eventErrors,
                        props.eventsScreenState.showingEventErrors,
                    )}
                />

                <Spacer size={16} />

                <DateField
                    label='Start'
                    disabled={state.isSaving}
                    {...fieldProps(
                        props.eventsScreenState.eventBeingEdited,
                        'start_datetime',
                        props.eventsScreenState.eventErrors,
                        props.eventsScreenState.showingEventErrors,
                    )}
                />

                <Spacer size={16} />

                <DateField
                    label='End'
                    disabled={state.isSaving}
                    {...fieldProps(
                        props.eventsScreenState.eventBeingEdited,
                        'end_datetime',
                        props.eventsScreenState.eventErrors,
                        props.eventsScreenState.showingEventErrors,
                    )}
                />

                <Spacer size={16} />

                <InfoBlurb>
                    Your event can take place at Vibeclipse, or it can take
                    place before/after.
                    <br /><br />
                    Vibeclipse camp site locations have limited capacity, and
                    scheduling will be first-come-first-serve for a given place
                    + time.
                </InfoBlurb>

                <Spacer size={16} />

                <RowSelect
                    label='My event will be...'
                    options={['At Vibeclipse', 'Offsite']}
                    value={state.locationType}
                    onChange={setter(state, 'locationType')}
                />

                <Spacer size={16} />

                {state.locationType === 'At Vibeclipse'
                    ? <>
                        <RadioGroup
                            options={Store.allEventSites.state.result?.map(s => ({
                                value: s.event_site_id,
                                label: s.name
                            })) ?? []}
                            directon='row'
                            {...fieldProps(
                                props.eventsScreenState.eventBeingEdited,
                                'event_site_location',
                                props.eventsScreenState.eventErrors,
                                props.eventsScreenState.showingEventErrors,
                            )}
                        />
                    </>
                    : <Input
                        label='Location'
                        disabled={state.isSaving}
                        multiline
                        {...fieldProps(
                            props.eventsScreenState.eventBeingEdited,
                            'plaintext_location',
                            props.eventsScreenState.eventErrors,
                            props.eventsScreenState.showingEventErrors,
                        )}
                        value={props.eventsScreenState.eventBeingEdited.plaintext_location ?? ''}
                    />}

                <Spacer size={8} />

                {selectedSite &&
                    <EventSiteInfo eventSite={selectedSite} />}

                <Spacer size={8} />

                <Button isSubmit isPrimary isLoading={state.isSaving}>
                    {props.eventsScreenState.eventBeingEdited.event_id == null
                        ? 'Create event'
                        : 'Save event'}
                </Button>

                <Spacer size={8} />

                <Button onClick={props.eventsScreenState.stopEditingEvent} disabled={state.isSaving}>
                    Cancel
                </Button>
            </Col>
        </form>
    )
})

const EventSiteInfo = observer((props: { eventSite: Tables['event_site'] }) => {

    return (
        <div>
            {props.eventSite.description}
        </div>
    )
})