import {  useRef, useState } from 'react';
import { LocationsProps, LocationInfo } from './types';
import EditLocationInfo from './edit-location-info';
import { Text, HBox, Spacer } from './elem';
import { Fab } from '@mui/material'
import { Add } from '@mui/icons-material';

export default function Locations({ guides, notify, reload }: LocationsProps) {
    const [editedLocation, seteditLocation] = useState<LocationInfo | undefined>(undefined);
    function getNewRoomInfo() : LocationInfo {
        return {
            name: "",
            url: "",
            path: "",
        }
    }

    return (

        <div  dir="rtl">
            {!editedLocation &&
            <Fab
                color="primary" aria-label="הוסף"
                variant="circular"
                style={{
                    position: "fixed",
                    bottom: 50,
                    right: 50,
                    zIndex: 1000,
                    borderRadius: '50%'
                }}
            >
                <Add onClick={() => { seteditLocation( getNewRoomInfo()) }} />
            </Fab>
            }
            { editedLocation && <EditLocationInfo location_info={editedLocation} afterSaved= {(g) => {seteditLocation(undefined); if(reload) reload();}}/>}
            {guides.map((m, i) => (
                <HBox key={i}>
                    <img src={m.url} style={{ width: 40, height: 40 }} alt={m.name}/>
                    <Spacer width={30}/>
                    <Text width={"50vw"} textAlign="right">{m.name}</Text>
                </HBox>
            ))}
        </div>);

}