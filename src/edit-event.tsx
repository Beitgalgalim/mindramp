import { useState, useEffect } from 'react';
import { Button, TextField } from '@mui/material';
import { HBoxC, HBoxSB, HBox, VBox, Text, Spacer, ComboBox } from './elem';


import { EditEventsProps, MediaResource } from './types';
import { AccessTime, Clear, Edit, Image, Mic, Notes, Repeat, Title } from '@mui/icons-material';
import { Checkbox, Grid } from '@material-ui/core';
import MyDatePicker from './date-picker';
import MediaPicker from './media-picker';
import { DocumentReference } from '@firebase/firestore/dist/lite';
import { Event, EventFrequency, RecurrentEventFieldKeyValue } from './event';

import AudioPlayerRecorder from './AudioRecorderPlayer';
import { Colors, Design } from './theme';


export default function AddEvent({ inEvent, onSave, onCancel, onDelete, media, notify }: EditEventsProps) {
    const [title, setTitle] = useState<string>(inEvent.event.title);
    const [notes, setNotes] = useState<string>();
    const [start, setStart] = useState<string>(inEvent.event.start);
    const [end, setEnd] = useState<string>(inEvent.event.end);
    const [imageUrl, setImageUrl] = useState<string>();
    const [audioUrl, setAudioUrl] = useState<string>();
    const [audioPath, setAudioPath] = useState<string>();
    const [audioBlob, setAudioBlob] = useState<any>();
    const [clearAudio, setClearAudio] = useState<boolean>(false);
    const [ref, setRef] = useState<DocumentReference | undefined>();
    const [instanceStatus, setInstanceStatus] = useState<boolean>();
    const [editImage, setEditImage] = useState(false);
    const [recurrent, setRecurrent] = useState<EventFrequency | undefined>(undefined);

    useEffect(() => {
        const event = Event.fromEventAny(inEvent.event);
        const recu = event.recurrent;
        setInstanceStatus(event.instanceStatus);

        if (event._ref) {
            setRef(event._ref);
        }
        if (inEvent.editAllSeries && recu) {
            setRecurrent(recu.freq);
        }
        setNotes(event.notes);
        setImageUrl(event.imageUrl);
        setAudioUrl(event.audioUrl);
        setAudioPath(event.audioPath);
    }, [inEvent]);




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
            <Text fontSize={45} textAlign="center">{ref ? "עדכון ארוע" : "ארוע חדש"}</Text>
            {editImage && <MediaPicker media={media}
                onSelect={(rm: MediaResource) => {
                    setImageUrl(rm.url);
                    setEditImage(false);
                }}
                onCancel={() => setEditImage(false)}
            />
            }

            <VBox style={{ marginRight: "10vw", marginTop: "3vh" }}>
                <Grid container spacing={2} style={{ textAlign: "right" }}>
                    <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                        <Title />
                    </Grid>
                    <Grid container item xs={9} spacing={2} >
                        <TextField variant="standard" helperText="כותרת" onChange={(e => setTitle(e.currentTarget.value))} value={title || ""} />
                    </Grid>
                </Grid>
                <Spacer height={30} />

                <Grid container spacing={2} style={{ textAlign: "right" }}>
                    <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }}>
                        <AccessTime />
                    </Grid>
                    <Grid container item xs={11} spacing={2} >
                        <MyDatePicker start={start} end={end}
                            setStart={(d) => setStart(d)}
                            setEnd={(d) => setEnd(d)}
                        //style={{width:"100%"}}
                        />
                    </Grid>
                </Grid>
                <Spacer height={30} />
                <Grid container spacing={2} style={{ textAlign: "right" }}>
                    <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                        <Notes />
                    </Grid>
                    <Grid container item xs={9} spacing={2} >
                        <TextField variant="standard" helperText="תיאור"
                            onChange={(e => setNotes(e.currentTarget.value))} value={notes || ""} />
                    </Grid>
                </Grid>
                <Spacer height={30} />

                <Grid container spacing={2} style={{ textAlign: "right" }}>
                    <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }}>
                        <Image />
                    </Grid>
                    <Grid container item xs={4} spacing={2} >
                        <HBoxSB >
                            {imageUrl ? <img src={imageUrl} alt="אין תמונה" style={{ width: Design.eventImageSize, height:  Design.eventImageSize }} /> : <Text>אין תמונה</Text>}
                            <HBox>
                            {imageUrl && <Clear onClick={() => setImageUrl(undefined)} style={{fontSize:35}}/>}
                            <Edit onClick={() => setEditImage(true)} style={{fontSize:35}}/>
                            </HBox>
                        </HBoxSB>
                    </Grid>
                </Grid>
                <Spacer height={30} />

                {/* Audio recording */}
                <Grid container spacing={2} style={{ textAlign: "right" }}>
                    <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
                        <Mic />
                    </Grid>
                    <Grid container item xs={4} spacing={2} >
                        <HBoxSB >
                            {(audioUrl || audioBlob) && !clearAudio ? <Text >יש שמע</Text> : <Text >אין שמע</Text>}
                            <AudioPlayerRecorder notify={notify}
                            showRecordButton={true} showClearButton={audioUrl || audioBlob}
                                showPlayButton={audioUrl || audioBlob} onCapture={(blob) => {
                                    setAudioBlob(blob)
                                    setClearAudio(false);
                                }} onClear={() => {
                                    if (audioBlob) {
                                        setAudioBlob(undefined);
                                    } else if (audioUrl) {
                                        setClearAudio(true);
                                    }
                                }}
                                audioBlob={audioBlob} audioUrl={clearAudio ? undefined : audioUrl}
                                buttonSize={35} />
                        </HBoxSB>
                    </Grid>
                </Grid>
                <Spacer height={30} />

                {/* Recurrence */}
                <Grid container spacing={2} style={{ textAlign: "right" }}>
                    <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }}>
                        <Repeat />
                    </Grid>
                    <Grid container item xs={9} spacing={2} >
                        <HBox style={{ alignItems: "center" }}>

                            {/* <FormControlLabel 
                            style={{ justifyContent: "flex-start" }}
                                control={ */}
                            <Checkbox onChange={(evt) => {
                                if (evt.currentTarget.checked) {
                                    setRecurrent("weekly");
                                } else {
                                    setRecurrent(undefined);
                                }
                            }} checked={recurrent !== undefined}
                                disabled={inEvent.editAllSeries === false}
                                style={{ paddingRight: 0 }} />
                            <Text fontSize={13}>חוזר</Text>
                            {/* } label="חוזר" /> */}


                            <Spacer width={25} />
                            {recurrent && <ComboBox 
                                style={{width: 200}}
                                value={recurrent} 
                                items={RecurrentEventFieldKeyValue}
                                onSelect={(newValue: EventFrequency) => setRecurrent(newValue)}
                                readOnly={true}
                            />
                            }
                            <Spacer width={25} />
                        </HBox>
                    </Grid>
                </Grid>
            </VBox>

            <HBoxC style={{ position: "absolute", bottom: "2%" }}>
                <Button variant="contained" onClick={() => {

                    const recurrentField = inEvent.event.recurrent || {};
                    recurrentField.freq = recurrent || "none";

                    onSave(
                        {
                            event: Event.fromAny({
                                title,
                                start,
                                end,
                                notes,
                                imageUrl,
                                audioUrl,
                                audioPath,
                                clearAudio,
                                ...(audioBlob != null && { audioBlob: audioBlob }),
                                ...(instanceStatus && { instanceStatus }),
                                ...(recurrent && { recurrent: recurrentField }),
                            }),
                            editAllSeries: inEvent.editAllSeries
                        },
                        ref);
                }}>שמור</Button>
                <Spacer width={25} />
                {ref && onDelete && <Button variant="contained" onClick={() => onDelete(inEvent, ref)}>מחק</Button>}
                <Button variant="contained" onClick={() => onCancel()} >בטל</Button>

            </HBoxC>
        </div >
    );
}