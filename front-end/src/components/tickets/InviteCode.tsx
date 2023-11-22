import React, { useState, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { Maybe } from '../../../../back-end/types/misc'
import Icon from '../core/Icon'

type Props = {
    code: string,
    usedBy: Maybe<string>
}

export default observer(({ code, usedBy }: Props) => {
    const [copied, setCopied] = useState(false)

    const copy = useCallback(async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
    }, [code])

    return (
        <div className={'invite-code' + ' ' + (usedBy != null ? 'used' : '')}>
            <div className='code-widget'>
                <div className='code'>
                    {code}
                </div>

                <button onClick={copy}>
                    {copied
                        ? <Icon name='check' />
                        : <Icon name='content_copy' />}
                </button>
            </div>


            <div className='used-by'>
                {usedBy != null && `Used by ${usedBy}`}
            </div>
        </div>
    )
})
