import {  useRef } from 'react';
import { MediaProps, MediaResource } from './types';

import { Text, HBoxSB, Spacer } from './elem';
import * as api from './api'
import { Button } from '@material-ui/core';



export default function Media({ media, notify }: MediaProps) {

    const inputEl = useRef<HTMLInputElement | null>(null);
    return (<div>
        {media.map((m, i) => (
            <HBoxSB key={i}>
                <Text>{m.name}</Text>
                <img src={m.url} style={{ width: 40, height: 40 }} alt={m.name}/>
                <Spacer />
                <Button variant={"outlined"}
                    onClick={()=>notify.ask("האם למחוק?", undefined, [
                            {
                                caption: "כן",
                                callback: () => {
                                    if (m._ref) {
                                        api.deleteMedia(m.path, m._ref).then(
                                            () => notify.success("נמחק בהצלחה"),
                                            (err: Error) => notify.error(err.message)
                                        )
                                    }
                                }
                            },
                            {
                                caption: "לא",
                                callback: () => { }
                            }
                        ])
                    }>מחק</Button>
            </HBoxSB>
        ))}

        <input type="file" ref={inputEl} />
        <Button onClick={() => {
            const files = inputEl?.current?.files;
            if (files && files.length > 0) {
                api.addMedia(files[0].name, "photo", files[0]).then(
                    (m: MediaResource) => { notify.success(`תמונה עלתה בהצלחה`) }
                )
            }
        }}>שמור</Button>
    </div>);
}
