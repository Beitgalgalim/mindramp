import { useState, useEffect } from 'react';
import { Button, TextField } from '@mui/material';
import { HBoxC, HBoxSB, HBox, VBox, Text, Spacer, ComboBox } from './elem';


import {  EditEventsProps, MediaResource } from './types';
import { AccessTime, Edit, Image, Notes, Repeat, Title } from '@mui/icons-material';
import { Checkbox, FormControlLabel, Grid } from '@material-ui/core';
import MyDatePicker from './date-picker';
import MediaPicker from './media-picker';
import { DocumentReference } from '@firebase/firestore/dist/lite';
import { Event } from './event';
import { DateFormats } from './utils/date';

const dayjs = require('dayjs');

export default function AddEvent({ inEvent, onSave, onCancel, onDelete, media }: EditEventsProps){
    const [title, setTitle] = useState<string>(inEvent.event.title);
    const [notes, setNotes] = useState<string>();
    const [start, setStart] = useState<string>(inEvent.event.start);
    const [end, setEnd] = useState<string>(inEvent.event.end);
    const [imageUrl, setImageUrl] = useState<string>();
    const [ref, setRef] = useState<DocumentReference | undefined>();
    const [instanceStatus, setInstanceStatus] = useState<boolean>();
    const [editImage, setEditImage] = useState(false);
    const [recurrent, setRecurrent] = useState<string | undefined>(undefined);

    useEffect(() => {
        const event = Event.fromEventAny(inEvent.event);
        const recu = event.recurrent;
        setInstanceStatus(event.instanceStatus);

        if (event._ref) {
            setRef(event._ref);
        }
        if (inEvent.editAllSeries && recu) {
            setRecurrent(recu.freq === "weekly" ? "שבועי" : recu.freq === "daily" ? "יומי" : "");
        }
        setNotes(event.notes);
        setImageUrl(event.imageUrl);
    }, [inEvent]);


    return (
        <div dir="rtl" style={{ position: 'absolute', top: 0, height: "100vh", width: '100%', backgroundColor: 'white', zIndex: 500 }}>
            <h1>{ref ? "עדכון ארוע" : "ארוע חדש"}</h1>
            {editImage && <MediaPicker media={media}
                onSelect={(rm: MediaResource) => {
                    setImageUrl(rm.url);
                    setEditImage(false);
                }}
                onCancel={() => setEditImage(false)}
            />
            }
            <VBox style={{ margin: "10%" }}>
                <Grid container spacing={2} style={{ textAlign: "right" }}>
                    <Grid container item xs={2} spacing={2} >
                        <Title />
                    </Grid>
                    <Grid container item xs={9} spacing={2} >
                        <TextField variant="standard" helperText="כותרת" onChange={(e => setTitle(e.currentTarget.value))} value={title || ""} />
                    </Grid>
                </Grid>
                <Spacer height={20} />

                <Grid container spacing={2} style={{ textAlign: "right" }}>
                    <Grid container item xs={2} spacing={2} >
                        <AccessTime />
                    </Grid>
                    <Grid container item xs={9} spacing={2} >
                        <MyDatePicker start={start} end={end}
                            setStart={(d) => setStart(d)}
                            setEnd={(d) => setEnd(d)}
                        />
                    </Grid>
                </Grid>
                <Spacer height={20} />
                <Grid container spacing={2} style={{ textAlign: "right" }}>
                    <Grid container item xs={2} spacing={2} >
                        <Notes />
                    </Grid>
                    <Grid container item xs={9} spacing={2} >
                        <TextField variant="standard" helperText="תיאור"
                            onChange={(e => setNotes(e.currentTarget.value))} value={notes || ""} />
                    </Grid>
                </Grid>
                <Spacer height={20} />

                <Grid container spacing={2} style={{ textAlign: "right" }}>
                    <Grid container item xs={2} spacing={2} >
                        <Image />
                    </Grid>
                    <Grid container item xs={9} spacing={2} >
                        <HBoxSB>
                            {imageUrl ? <img src={imageUrl} alt="אין תמונה" style={{ width: 100, height: 100 }} /> : <Text>אין תמונה</Text>}
                            <Edit onClick={() => setEditImage(true)} />
                        </HBoxSB>
                    </Grid>
                </Grid>
                <Spacer height={20} />

                <Grid container spacing={2} style={{ textAlign: "right" }}>
                    <Grid container item xs={2} spacing={2} >
                        <Repeat />
                    </Grid>
                    <Grid container item xs={9} spacing={2} >
                        <HBox style={{ alignItems: "center" }}>

                            <FormControlLabel control={
                                <Checkbox onChange={(evt) => {
                                    if (evt.currentTarget.checked) {
                                        setRecurrent("שבועי");
                                    } else {
                                        setRecurrent(undefined);
                                    }
                                }} checked={recurrent !== undefined} disabled={inEvent.editAllSeries === false} />
                            } label="חוזר" />


                            <Spacer width={30} />
                            {recurrent && <ComboBox value={recurrent} items={["שבועי", "יומי"]}
                                onSelect={(newValue: string) => setRecurrent(newValue)}  
                                readOnly={true}                              
                                />
                            }
                            <Spacer width={30} />
                        </HBox>
                    </Grid>
                </Grid>
            </VBox>

            <HBoxC style={{ position: "absolute", bottom: "10%" }}>
                <Button variant="outlined" onClick={() => {

                    const recurrentField = inEvent.event.recurrent || {};
                    recurrentField.freq = recurrent === "שבועי" ? "weekly" : recurrent === "יומי" ? "daily" : "none";

                    onSave(
                        {
                            event: Event.fromAny({
                                title,
                                start,
                                end,
                                notes,
                                imageUrl,
                                ...(instanceStatus && {instanceStatus}),
                                ...(recurrent && {recurrent: recurrentField}),
                            }), 
                            editAllSeries: inEvent.editAllSeries
                        },
                        ref);
                }}>שמור</Button>
                <Spacer width={30} />
                {ref && onDelete && <Button variant="outlined" onClick={() => onDelete(inEvent, ref)}>מחק</Button>}
                <Button variant="outlined" onClick={() => onCancel()} >בטל</Button>

            </HBoxC>
        </div >
    );
}