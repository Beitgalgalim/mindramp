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
    const [email, setEmail] = useState<string>(guide_info._ref ? guide_info._ref.id : "");

    function onSelectedFile(f : any) {
        if(!f.target.files || f.target.files.length === 0){
            setPreview(undefined);
        }
        const objectUrl = URL.createObjectURL(f.target.files[0]);
        setPreview(objectUrl);

    }

    function onEmailChange(n: any) {
        setEmail(n.currentTarget.value);
    }

    function onFNameChange(n: any) {
        setFName(n.currentTarget.value);
    }

    function onLNameChange(n: any) {
        setLName(n.currentTarget.value);
    }

    function onDelete() {
        if (guide_info._ref)
            api.deleteMedia(guide_info.avatar.path, guide_info._ref).finally(()=> afterSaved());
    }

    function onSave() {
        const files = inputEl?.current?.files;
        
        // exist guide
        if (guide_info._ref) {
            api.editGuideInfo(guide_info._ref, fname, lname, (files && files.length)? files[0] : null).then( () => { 
                console.log(`המדריך עודכן בהצלחה`);
                afterSaved();
            },
            (err)=>console.log(err)
            );
            return;
        }
        
        // new guide
        if(files && files.length > 0 && email.length) {
            api.addGuideInfo(fname, lname, email, files[0]).then(
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
            {guide_info._ref    ? <TextField variant="standard" helperText="אימייל" type="email" value={email} disabled />
                                : <TextField variant="standard" helperText="אימייל" type="email" value={email} onChange={onEmailChange} />}
            <TextField variant="standard" helperText="שם פרטי"  value={fname} onChange={onFNameChange} />
            <TextField variant="standard" helperText="שם משפחה"  value={lname} onChange={onLNameChange} />
            <Text>תמונה של המנחה</Text>
            <input className="custom-file-input" type="file" ref={inputEl} style={{width:400}} onChange={onSelectedFile} />
            {inputEl && <img src={preview} style={{width:48}} alt={fname + " " + lname} />}
            <Button variant="contained" onClick={onSave}>שמור</Button>
            {guide_info._ref && <Button variant="contained" onClick={onDelete}>מחיקה</Button> }
            <Button variant="contained" onClick={afterSaved}>ביטול</Button>
            </div>);
}