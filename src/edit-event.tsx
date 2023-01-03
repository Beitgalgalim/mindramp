 import { useState, useEffect } from 'react';
// import { Button, FormControlLabel, FormGroup, getDialogActionsUtilityClass, TextField } from '@mui/material';
// import { HBoxC, HBoxSB, HBox, VBox, Text, Spacer, ComboBox } from './elem';
// import dayjs from './localDayJs';


// import { EditEventsProps, MediaResource, UserInfo, UserType, LocationInfo } from './types';
// import { AccessTime, AddPhotoAlternateOutlined, Clear, Image, Mic, Notes, NotificationsActive, PeopleOutline, PersonOutlined, Repeat, Title, LocationOn } from '@mui/icons-material';
// import { Checkbox, Grid } from '@mui/material';
// import MediaPicker from './media-picker';
// // import { DocumentReference } from '@firebase/firestore/dist/lite';
// import { Event, EventFrequency, Participant, RecurrentEventFieldKeyValue, ReminderFieldKeyValue, LocationsFieldKeyValue } from './event';
// import { getLocations } from './api'

// import AudioPlayerRecorder from './AudioRecorderPlayer';
// import { Colors, Design } from './theme';
// import { PeoplePicker, Person } from './people-picker';
// import { DateJSParseFormats, removeTime, replaceDatePreserveTime2, toMidNight } from './utils/date';
// import NewDatePicker from './newDatePicker';


// export default function EditEvent(
//     { inEvent, onSave, onCancel, onDelete, media, users, notify, events, updateInProgress }: EditEventsProps) {
//     const [title, setTitle] = useState<string>(inEvent.event.title);
//     const [notes, setNotes] = useState<string>();
//     const [start, setStart] = useState<string>(inEvent.event.start);
//     const [end, setEnd] = useState<string>(inEvent.event.end);
//     const [imageUrl, setImageUrl] = useState<string>();
//     const [guide, setGuide] = useState<Participant | null>();
//     const [audioUrl, setAudioUrl] = useState<string>();
//     const [audioPath, setAudioPath] = useState<string>();
//     const [audioBlob, setAudioBlob] = useState<any>();
//     const [clearAudio, setClearAudio] = useState<boolean>(false);
//     const [id, setId] = useState<string | undefined>(inEvent.event.id);
//     const [instanceStatus, setInstanceStatus] = useState<boolean>();
//     const [editImage, setEditImage] = useState(false);
//     const [participants, setParticipants] = useState<any>({});
//     const [availableUsers, setAvailableUsers] = useState<UserInfo[]>([]);
//     const [keyEvent, setKeyEvent] = useState<boolean>(false);
//     const [allDay, setAllDay] = useState<boolean>(inEvent.event.allDay === true);
//     const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);

//     const [recurrent, setRecurrent] = useState<EventFrequency | undefined>(undefined);

//     const [selectedLocation, setSelectedLocation] = useState<string>();
//     const [locations, setLocations] = useState<LocationsFieldKeyValue[]>([]);

//     useEffect(() => {
//         const event = Event.fromEventAny(inEvent.event);
//         const recu = event.recurrent;
//         setInstanceStatus(event.instanceStatus);

//         if (event.id) {
//             setId(event.id);
//         }
//         if (inEvent.editAllSeries && recu) {
//             setRecurrent(recu.freq);
//         }
//         setNotes(event.notes);
//         if (event.keyEvent === true) {
//             setKeyEvent(true);
//         }

//         if (event.allDay) {
//             setAllDay(true);
//         }
//         setImageUrl(event.imageUrl);
//         if (event.guide !== null) {
//             setGuide(event.guide);
//         }

//         setAudioUrl(event.audioUrl);
//         setAudioPath(event.audioPath);
//         if (event.location) {
//             setSelectedLocation(event.location)
//         }
//         if (event.participants) {
//             setParticipants(event.participants);
//         }
//         if (event.reminderMinutes || event.reminderMinutes === 0) {
//             setReminderMinutes(event.reminderMinutes);
//         }
//     }, [inEvent]);

//     useEffect(() => {
//         setAvailableUsers(users.filter((u: UserInfo) => !participants || !participants[Event.getParticipantKey(u._ref?.id)]))
//     }, [users, participants]);


//     useEffect(() => {
//         // calculate conflicts
//         Event.getParticipantsAsArray(participants).forEach((p: any, key) => {
//             p.uidata = {
//                 available: true,
//                 availabilityDescription: "",
//             };
//             // search for overlapping events:
//             events.forEach(ev => {
//                 if (ev.id !== inEvent.event.id && ev.participants)
//                     if (
//                         //event overlap: 
//                         ((start <= ev.start && end > ev.start) || (start >= ev.start && start < ev.end)) &&
//                         ev.participants[Event.getParticipantKey(p.email)]) {
//                         if (p.uidata) {
//                             p.uidata.available = false;
//                             p.uidata.availabilityDescription += (ev.title + "\n");
//                         }
//                     }
//             })

//         })


//     }, [events, participants, start, end])

//     useEffect(() => {
//         getLocations().then((locationsInfo: LocationInfo[]) => {
//             setLocations(
//                 locationsInfo.map((l: LocationInfo, index: number): LocationsFieldKeyValue => {
//                     return {
//                         key: index.toString(),
//                         value: l.name
//                     }
//                 })
//             )
//         }).catch((error) =>
//             console.error("get locations failed: ", error)
//         );
//     }, [])


//     const narrow = window.innerWidth < 430;


//     return (
//         <div dir="rtl" style={{
//             position: 'absolute',
//             top: "10vh",
//             left: narrow ? "2vw" : "10vw",
//             height: "85vh",
//             width: narrow ? "96vw" : "80vw",
//             backgroundColor: Colors.PopupBackground,
//             zIndex: 500,
//             borderRadius: 15,
//             boxShadow: Design.popUpboxShadow,
//         }}>
//             <Text fontSize={45} textAlign="center">{id ? "עדכון ארוע" : "ארוע חדש"}</Text>
//             {editImage && <MediaPicker media={media} title={"בחירת תמונה"}
//                 onSelect={(rm: MediaResource) => {
//                     setImageUrl(rm.url);
//                     setEditImage(false);
//                 }}
//                 onCancel={() => setEditImage(false)}
//             />
//             }

//             <Grid
//                 style={{ marginTop: "3vh", paddingRight: "10vw", overflowY: "scroll", maxHeight: "65vh" }}
//                 container
//                 spacing={2}
//             >
//                 <Grid container spacing={2} style={{ textAlign: "right" }}>
//                     <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
//                         <Title />
//                     </Grid>
//                     <Grid container item xs={9} spacing={2} >
//                         <TextField autoFocus variant="standard" helperText="כותרת" onChange={(e => setTitle(e.currentTarget.value))} value={title || ""} />
//                     </Grid>
//                 </Grid>
//                 <Spacer height={30} />

//                 <Grid container spacing={2} style={{ textAlign: "right" }}>
//                     <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }}>
//                         <AccessTime />
//                     </Grid>
//                     <Grid container item xs={10} spacing={2} >
//                         <VBox style={{ alignItems: 'flex-start', width:"100%" }}>
//                             <NewDatePicker
//                                 fontSize="1em"
//                                 start={start} end={end}
//                                 setStart={(d) => setStart(d)}
//                                 setEnd={(d) => setEnd(d)}
//                                 pickTimes={!allDay}
//                             />
//                             <FormGroup>
//                                 <FormControlLabel control={<Checkbox
//                                     checked={allDay === true}
//                                     onChange={(e) => setAllDay(prev => e.currentTarget.checked)}
//                                 />} label="הודעה" />
//                             </FormGroup>
//                         </VBox>
//                     </Grid>
//                 </Grid>
//                 <Spacer height={30} />
//                 <Grid container spacing={2} style={{ textAlign: "right" }}>
//                     <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
//                         <Notes />
//                     </Grid>
//                     <Grid container item xs={9} spacing={2} >
//                         <TextField variant="standard" helperText="תיאור"
//                             onChange={(e => setNotes(e.currentTarget.value))} value={notes || ""} />
//                         <Spacer />
//                         <FormGroup>
//                             <FormControlLabel control={<Checkbox
//                                 checked={keyEvent === true}
//                                 onChange={(e) => setKeyEvent(prev => e.currentTarget.checked)}
//                             />} label="אירוע מיוחד" />
//                         </FormGroup>
//                     </Grid>
//                 </Grid>
//                 <Spacer height={30} />

//                 <Grid container spacing={2} style={{ textAlign: "right" }}>
//                     <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }}>
//                         <Image />
//                     </Grid>
//                     <Grid container item xs={5} spacing={2} >
//                         <HBoxSB >
//                             {imageUrl ? <img src={imageUrl} alt="אין תמונה" style={{ width: Design.eventImageSize, height: Design.eventImageSize }} /> : <Text>אין תמונה</Text>}
//                             <HBox>
//                                 {imageUrl && <Clear onClick={() => setImageUrl(undefined)} style={{ fontSize: 35 }} />}
//                                 <AddPhotoAlternateOutlined onClick={() => setEditImage(true)} style={{ fontSize: 35 }} />
//                             </HBox>
//                         </HBoxSB>
//                     </Grid>
//                 </Grid>
//                 <Spacer height={30} />

//                 {/** Guide */}
//                 <Grid container spacing={2} style={{ textAlign: "right" }}>
//                     <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }}>
//                         <PersonOutlined />
//                     </Grid>
//                     <Grid container item xs={5} spacing={2} >
//                         <VBox style={{ alignItems: "flex-start" }}>

//                             <PeoplePicker
//                                 users={users}
//                                 type={UserType.GUIDE}
//                                 placeholder={"בחירת מדריך"}
//                                 onSelect={(person: string) => {
//                                     const guideUserInfo = users.find(u => u._ref?.id === person);
//                                     if (guideUserInfo) {
//                                         setGuide({
//                                             displayName: guideUserInfo.displayName,
//                                             email: person,
//                                             ...(guideUserInfo.avatar && { icon: guideUserInfo.avatar.url }),
//                                         });
//                                     };

//                                 }}
//                             />
//                             <Spacer height={10} />
//                             <HBox>
//                                 <Spacer width={20} />
//                                 {guide && <Person
//                                     width={120}
//                                     name={guide.displayName}
//                                     icon={guide.icon}
//                                     onRemove={() => setGuide(null)}
//                                 />}
//                             </HBox>
//                         </VBox>
//                     </Grid>
//                 </Grid>
//                 <Spacer height={30} />

//                 {/** Participants */}
//                 <Grid container spacing={2} style={{ textAlign: "right" }}>
//                     <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }}>
//                         <PeopleOutline />
//                     </Grid>
//                     <Grid container item xs={8} spacing={2} >
//                         <VBox style={{ alignItems: "flex-start" }}>
//                             <PeoplePicker
//                                 users={availableUsers}
//                                 placeholder={"הוספת מוזמנים"}

//                                 onSelect={(person: string) => {
//                                     const selectedUser = users.find((u: UserInfo) => u._ref?.id === person);
//                                     if (selectedUser) {
//                                         const newParticipant = {
//                                             displayName: selectedUser.displayName,
//                                             email: selectedUser._ref?.id || "",
//                                             ...(selectedUser.avatar && { icon: selectedUser.avatar.url }),
//                                         }
//                                         setParticipants((curr: any | null) => ({
//                                             ...curr,
//                                             [Event.getParticipantKey(newParticipant.email)]: newParticipant
//                                         }));
//                                     }
//                                 }} />
//                             <Spacer height={10} />
//                             <HBox style={{ maxWidth: "80vw", flexWrap: "wrap" }}>
//                                 <Spacer width={20} />
//                                 {participants && Event.getParticipantsAsArray(participants).map((g: Participant, i) => <Person key={i}
//                                     width={150}
//                                     icon={g.icon}
//                                     name={g.displayName}
//                                     available={g.uidata?.available}
//                                     tooltip={g.uidata?.availabilityDescription}
//                                     onRemove={() => setParticipants((curr: any | null) => {
//                                         if (!curr) {
//                                             return curr;
//                                         } else {
//                                             const newParticipants = { ...curr };
//                                             delete newParticipants[Event.getParticipantKey(g.email)];
//                                             return newParticipants;
//                                         }
//                                     })} />)}
//                             </HBox>
//                         </VBox>
//                     </Grid>
//                 </Grid>
//                 <Spacer height={30} />

//                 {/** Location */}
//                 <Grid container spacing={2} style={{ textAlign: "right" }}>
//                     <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }}>
//                         <LocationOn />
//                     </Grid>
//                     <Grid container item xs={5} spacing={2} >
//                         <VBox style={{ alignItems: "flex-start" }}>
//                             <ComboBox
//                                 listStyle={{
//                                     width: 150,
//                                     textAlign: "right",
//                                     //backgroundColor: "white",
//                                     //height: 25,
//                                 }}
//                                 itemHeight={35}
//                                 listWidth={150}
//                                 hideExpandButton={true}
//                                 placeholder={"בחירת מיקום"}
//                                 items={locations}
//                                 value={selectedLocation}
//                                 onSelect={(locationKey: string) => setSelectedLocation(
//                                     locations.filter((obj: LocationsFieldKeyValue) => obj.key == locationKey)[0].value
//                                 )}
//                                 onChange={(locationKey: string) => setSelectedLocation(locationKey)}
//                             />
//                             <Spacer width={25} />
//                         </VBox>
//                     </Grid>
//                 </Grid>
//                 <Spacer height={30} />

//                 {/* Audio recording */}
//                 <Grid container spacing={2} style={{ textAlign: "right" }}>
//                     <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }} >
//                         <Mic />
//                     </Grid>
//                     <Grid container item xs={5} spacing={2} >
//                         <HBoxSB >
//                             {(audioUrl || audioBlob) && !clearAudio ? <Text >יש שמע</Text> : <Text >אין שמע</Text>}
//                             <AudioPlayerRecorder notify={notify}
//                                 showRecordButton={true} showClearButton={audioUrl || audioBlob}
//                                 showPlayButton={audioUrl || audioBlob} onCapture={(blob) => {
//                                     setAudioBlob(blob)
//                                     setClearAudio(false);
//                                 }} onClear={() => {
//                                     if (audioBlob) {
//                                         setAudioBlob(undefined);
//                                     } else if (audioUrl) {
//                                         setClearAudio(true);
//                                     }
//                                 }}
//                                 audioBlob={audioBlob} audioUrl={clearAudio ? undefined : audioUrl}
//                                 buttonSize={35} />
//                         </HBoxSB>
//                     </Grid>
//                 </Grid>
//                 <Spacer height={25} />

//                 {/* Recurrence */}
//                 <Grid container spacing={2} style={{ textAlign: "right" }}>
//                     <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }}>
//                         <Repeat />
//                     </Grid>
//                     <Grid container item xs={4} spacing={2} >
//                         <HBox style={{ alignItems: "center" }}>

//                             <Checkbox onChange={(evt) => {
//                                 if (evt.currentTarget.checked) {
//                                     setRecurrent("weekly");
//                                 } else {
//                                     setRecurrent(undefined);
//                                 }
//                             }} checked={recurrent !== undefined}
//                                 disabled={inEvent.editAllSeries === false}
//                                 style={{ paddingRight: 0 }} />
//                             <Text >חוזר</Text>
//                         </HBox>

//                     </Grid>
//                     <Grid container item xs={6} spacing={2} >

//                         {recurrent && <ComboBox
//                             listStyle={{ width: "30vw", textAlign: "right" }}
//                             listWidth={150}
//                             value={recurrent}
//                             items={RecurrentEventFieldKeyValue}
//                             onSelect={(newValue: string) => setRecurrent(newValue as EventFrequency)}
//                             readOnly={true}
//                         />
//                         }
//                         <Spacer width={25} />
//                     </Grid>
//                 </Grid>
//                 <Spacer height={25} />

//                 {/*reminder*/}
//                 <Grid container spacing={2} style={{ textAlign: "right" }}>
//                     <Grid container item xs={2} spacing={2} style={{ alignItems: "center" }}>
//                         <NotificationsActive />
//                     </Grid>
//                     <Grid container item xs={4} spacing={2} >
//                         <HBox style={{ alignItems: "center" }}>

//                             <Checkbox onChange={(evt) => {
//                                 if (evt.currentTarget.checked) {
//                                     setReminderMinutes(15);
//                                 } else {
//                                     setReminderMinutes(null);
//                                 }
//                             }}
//                                 checked={(reminderMinutes || reminderMinutes === 0) ? true : false}
//                                 style={{ paddingRight: 0 }} />
//                             <Text>תזכורת</Text>
//                         </HBox>
//                     </Grid>
//                     <Grid container item xs={6} spacing={2} >


//                         {(reminderMinutes || reminderMinutes === 0) && <ComboBox
//                            listStyle={{ width: "40vw", textAlign: "right" }}

//                             value={reminderMinutes || reminderMinutes === 0 ? reminderMinutes + "" : ""}
//                             items={ReminderFieldKeyValue}
//                             listWidth={150}
//                             onSelect={(newValue: string) => {
//                                 const minutes = parseInt(newValue);
//                                 if (!isNaN(minutes) && minutes >= 0 && minutes <= 720) {
//                                     // 0 to 1 day
//                                     setReminderMinutes(minutes);
//                                 }
//                             }}
//                             readOnly={true}
//                         />
//                         }
//                     </Grid>
//                 </Grid>
//             </Grid>

//             <HBoxC style={{ position: "absolute", bottom: "2%" }}>
//                 <Button variant="contained" disabled={updateInProgress} onClick={() => {

//                     const recurrentField = inEvent.event.recurrent || {};
//                     recurrentField.freq = recurrent || "none";
//                     let endDateTime;
//                     let startDateTime = start
//                     if (!allDay) {
//                         // only allDay event can span over multiple dates
//                         endDateTime = replaceDatePreserveTime2(end, dayjs(start, DateJSParseFormats));
//                     } else {
//                         startDateTime = removeTime(start);
//                         endDateTime = removeTime(end);
//                     }

//                     onSave(
//                         {
//                             event: Event.fromAny({
//                                 title,
//                                 start: startDateTime,
//                                 end: endDateTime,
//                                 notes,
//                                 ...(keyEvent != null && { keyEvent }),
//                                 ...(allDay != null && { allDay }),
//                                 imageUrl,
//                                 location: selectedLocation,
//                                 audioUrl,
//                                 audioPath,
//                                 clearAudio,
//                                 ...(audioBlob != null && { audioBlob: audioBlob }),
//                                 ...(instanceStatus && { instanceStatus }),
//                                 ...(recurrent && { recurrent: recurrentField }),
//                                 participants,
//                                 ...(guide != null && { guide }),
//                                 ...(reminderMinutes != null && { reminderMinutes }),
//                             }),
//                             editAllSeries: inEvent.editAllSeries
//                         },
//                         id);
//                 }}>שמור</Button>
//                 <Spacer width={25} />
//                 {id && onDelete && <Button variant="contained"  disabled={updateInProgress} onClick={() => onDelete(inEvent, id)}>מחק</Button>}
//                 {id && onDelete && <Spacer width={25} />}
//                 <Button variant="contained" disabled={updateInProgress} onClick={() => onCancel()} >בטל</Button>

//             </HBoxC>
//         </div >
//     );
// }