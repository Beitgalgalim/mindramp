import {  useRef, useState } from 'react';
import { GuidesProps, GuideInfo } from './types';
import EditGuideInfo from './edit-guide-info';
import { Text, HBox, Spacer } from './elem';
import { Fab } from '@mui/material'
import { Add } from '@mui/icons-material';

export default function Guides({ guides, notify, reload }: GuidesProps) {
    const [editedGuide, seteditGuide] = useState<GuideInfo | undefined>(undefined);
    //console.log(guides_info);
    function getNewGuideInfo() : GuideInfo {
        return {
            name: "",
            url: "",
            path: "",
        }
    }

    return ( 

    <div  dir="rtl">
         {!editedGuide &&
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
                <Add onClick={() => { seteditGuide( getNewGuideInfo()) }} />
            </Fab>
        }
        { editedGuide && <EditGuideInfo guide_info={editedGuide} afterSaved= {(g) => {seteditGuide(undefined); if(reload) reload();}}/>}
        {guides.map((m, i) => (
        <HBox key={i}>
             <img src={m.url} style={{ width: 40, height: 40 }} alt={m.name}/>
             <Spacer width={30}/>
             <Text width={"50vw"} textAlign="right">{m.name}</Text>
        </HBox>
        ))}
    </div>);

}