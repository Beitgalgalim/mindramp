import  { useState, useEffect } from 'react';
import { Button, TextField } from '@mui/material';
import { HBoxC, HBoxSB, VBox, Text, Spacer } from './elem';
import { DateFormats } from './utils/date';
import { EventApi } from '@fullcalendar/common'


import { MediaResource, NewEvent } from './types';
import { AccessTime, Edit, Image, Notes } from '@mui/icons-material';
import { Grid } from '@material-ui/core';
import MyDatePicker from './date-picker';
import MediaPicker from './media-picker';

const dayjs = require('dayjs');

export default function AddEvent({ inEvent, onSave, onCancel, onDelete, media }: 
    { inEvent: NewEvent | EventApi, onSave: CallableFunction, 
        onCancel: CallableFunction, onDelete?:CallableFunction, media:MediaResource[] }) {
    const [title, setTitle] = useState<string>();
    const [notes, setNotes] = useState<string>();
    const [start, setStart] = useState<Date | null>();
    const [end, setEnd] = useState<Date | null>();
    const [imageUrl, setImageUrl] = useState<string>("");
    const [ref, setRef] = useState<string | null>();
    const [editImage, setEditImage] = useState(false);

    useEffect(() => {
        const ref = inEvent?.extendedProps?._ref;
        const notes = inEvent?.extendedProps?.notes;
        const imgUrl = inEvent?.extendedProps?.imageUrl;
        if (ref) {
            setRef(ref);
        }
        setStart(inEvent.start);
        setEnd(inEvent.end);
        setTitle(inEvent.title);
        setNotes(notes);
        setImageUrl(imgUrl)
    }, [inEvent]);




    return (
        <div dir="rtl" style={{ position: 'absolute', top: 0, height: "100vh", width: '100%', backgroundColor: 'white', zIndex: 500 }}>
            <h1>{ref ? "עדכון ארוע" : "ארוע חדש"}</h1>
            {editImage && <MediaPicker media={media} 
                onSelect={(rm:MediaResource)=>{
                    setImageUrl(rm.url);
                    setEditImage(false);
                }}
                onCancel={()=>setEditImage(false)}
                />
            }
            <VBox style={{ margin: "10%" }}>
                <Grid container spacing={2} style={{ textAlign: "right" }}>
                    <Grid container item xs={3} spacing={2} >

                    </Grid>
                    <Grid container item xs={9} spacing={2} >
                        <TextField variant="standard" helperText="כותרת" onChange={(e => setTitle(e.currentTarget.value))} value={title || ""} />
                    </Grid>
                    <Grid container item xs={3} spacing={2} >
                        <AccessTime />
                    </Grid>
                    <Grid container item xs={9} spacing={2} >
                        <MyDatePicker start={start} end={end}
                            setStart={(d: Date) => setStart(d)}
                            setEnd={(d: Date) => setEnd(d)}
                        />
                    </Grid>
                    <Spacer height={20} />
                    <Grid container item xs={3} spacing={2} >
                        <Notes />
                    </Grid>
                    <Grid container item xs={9} spacing={2} >
                        <TextField variant="standard" helperText="תיאור"
                            onChange={(e => setNotes(e.currentTarget.value))} value={notes || ""} />
                    </Grid>
                    <Grid container item xs={3} spacing={2} >
                        <Image />
                    </Grid>
                    <Grid container item xs={9} spacing={2} >
                        <HBoxSB>
                    {imageUrl ? <img src={imageUrl}  alt="אין תמונה" style={{width:100, height:100}}/>:<Text>אין תמונה</Text>}
                        <Edit onClick={()=>setEditImage(true)} />
                        </HBoxSB>
                    </Grid>
                </Grid>
            </VBox>

            <HBoxC style={{ position: "absolute", bottom: "10%" }}>
                <Button variant="outlined" onClick={() => {
                    onSave(
                        {
                            date: dayjs(start).format(DateFormats.DATE),
                            title,
                            start,
                            end,
                            notes,
                            imageUrl,
                            _ref:ref
                        });
                }}>שמור</Button>
                <Spacer width={30} />
                {ref && onDelete && <Button variant="outlined" onClick={() => onDelete(inEvent)}>מחק</Button>}
            <Button variant="outlined" onClick={() => onCancel()} >בטל</Button>

        </HBoxC>
        </div >
    );
}