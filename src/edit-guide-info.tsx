import { Colors, Design } from './theme';
import { Text, Spacer } from './elem';
import { Button, TextField } from '@mui/material';
import { GuideInfo, EditGuideInfoProps } from './types';
import { useEffect, useRef, useState } from 'react';
import * as api from "./api";

export default function EditGuideInfo({guide_info, afterSaved} : EditGuideInfoProps) {
    const inputEl = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string|undefined>();
    const [name, setName] = useState<string>(guide_info.name);


    function onSelectedFile(f : any) {
        if(!f.target.files || f.target.files.length == 0){
            setPreview(undefined);
        }
        const objectUrl = URL.createObjectURL(f.target.files[0]);
        setPreview(objectUrl);

    }

    function onNameChange(n: any) {
        setName(n.currentTarget.value);
    }

    function onSave() {
        //console.log("start save " + name );
        const files = inputEl?.current?.files;
        if (files && files.length > 0) {
            api.addGuideInfo(name, files[0]).then(
                    (g: GuideInfo) => { 
                        //console.log(`תמונה עלתה בהצלחה`);
                        afterSaved(g);
                    },
                    (err)=>console.log(err)
                );
            }
    }

    return (
        <div dir="rtl" style={{
            position: 'absolute',
            top: "10vh",
            left: "10vw",
            height: "85vh",
            width: '80vw',
            backgroundColor: Colors.PopupBackground,
            zIndex: 500,
            borderRadius: 15,
            boxShadow: Design.popUpboxShadow,
        }}>
            <TextField variant="standard" helperText="שם המנחה"  value={name} onChange={onNameChange} />
            <Text>תמונה של המנחה</Text>
            <input className="custom-file-input" type="file" ref={inputEl} style={{width:400}} onChange={onSelectedFile} />
            {inputEl && <img src={preview} style={{width:48}} />}
            <Button variant="contained" onClick={onSave}>שמור</Button>
            </div>);
}