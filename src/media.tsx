import {  useRef } from 'react';
import { MediaProps, MediaResource } from './types';

import { Text, HBox, HBoxC, Spacer } from './elem';
import * as api from './api'
import { Button } from '@material-ui/core';
import "./admin.css"



export default function Media({ media, notify, reload }: MediaProps) {

    const inputEl = useRef<HTMLInputElement | null>(null);
    return (<div  dir="rtl">
        {media.map((m, i) => (
            <HBox key={i}>
                <img src={m.url} style={{ width: 40, height: 40 }} alt={m.name}/>
                <Text width={"50vw"} textAlign="right">{m.name}</Text>
                <Spacer />
                <Button variant={"outlined"}
                    onClick={()=>notify.ask("האם למחוק?", undefined, [
                            {
                                caption: "כן",
                                callback: () => {
                                    if (m._ref) {
                                        api.deleteMedia(m.path, m._ref).then(
                                            () => {
                                                notify.success("נמחק בהצלחה");
                                                if (reload) reload();
                                            },
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
            </HBox>
        ))}
        <Spacer height={20}/>
        <HBoxC style={{ width:500}}>
        <input className="custom-file-input" type="file" ref={inputEl} style={{width:400}}/>
        <Spacer width={20}/>
        <Button 
        variant={"contained"} 
        onClick={() => {
            const files = inputEl?.current?.files;
            if (files && files.length > 0) {
                api.addMedia(files[0].name, "photo", files[0]).then(
                    (m: MediaResource) => { 
                        notify.success(`תמונה עלתה בהצלחה`);
                        if (inputEl.current) inputEl.current.value = "";
                        if (reload) reload();
                    },
                    (err)=>notify.error(err)
                );
            }
        }}>שמור</Button>
        </HBoxC>
    </div>);
}
