import { Colors, Design } from './theme';
import { Text } from './elem';
import { Button, TextField } from '@mui/material';
import { EditGuideInfoProps } from './types';
import { useRef, useState } from 'react';
import * as api from "./api";

export default function EditGuideInfo({guide_info, afterSaved} : EditGuideInfoProps) {
    const inputEl = useRef<HTMLInputElement | null>(null);
    const [preview, setPreview] = useState<string|undefined>(guide_info.avatar?.url);
    const [fname, setFName] = useState<string>(guide_info.fname);
    const [lname, setLName] = useState<string>(guide_info.lname);
    const [displayName, setDisplayName] = useState<string>(guide_info.displayName);


    function onSelectedFile(f : any) {
        if(!f.target.files || f.target.files.length === 0){
            setPreview(undefined);
        }
        const objectUrl = URL.createObjectURL(f.target.files[0]);
        setPreview(objectUrl);

    }

    function onFNameChange(n: any) {
        setFName(n.currentTarget.value);
    }

    function onLNameChange(n: any) {
        setLName(n.currentTarget.value);
    }

    function onDisplayNameChange(n: any) {
        setDisplayName(n.currentTarget.value);
    }

    function onSave() {
        const files = inputEl?.current?.files;
        
        // exist guide
        if (guide_info._ref) {
            api.editGuideInfo(guide_info._ref, fname, lname, displayName, (files && files.length)? files[0] : null).then( () => { 
                console.log(`המדריך עודכן בהצלחה`);
                afterSaved();
            },
            (err)=>console.log(err)
            );
            return;
        }
        
        // new guide
        if(files && files.length > 0) {
            api.addGuideInfo(fname, lname, displayName, files[0]).then(
                    () => { 
                        console.log(`המדריך נוצר בהצלחה`);
                        afterSaved();
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
            <TextField variant="standard" helperText="שם פרטי"  value={fname} onChange={onFNameChange} />
            <TextField variant="standard" helperText="שם משפחה"  value={lname} onChange={onLNameChange} />
            <TextField variant="standard" helperText="כינוי"  value={displayName} onChange={onDisplayNameChange} />
            <Text>תמונה של המנחה</Text>
            <input className="custom-file-input" type="file" ref={inputEl} style={{width:400}} onChange={onSelectedFile} />
            {inputEl && <img src={preview} style={{width:48}} alt={fname + " " + lname} />}
            <Button variant="contained" onClick={onSave}>שמור</Button>
            </div>);
}