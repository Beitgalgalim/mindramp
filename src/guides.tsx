import { useState } from 'react';
import { GuidesProps, UserInfo, UserType} from './types';
import EditGuideInfo from './edit-guide-info';
import { Text, HBox, Spacer } from './elem';
import { Fab } from '@mui/material';
import { Add } from '@mui/icons-material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';

export default function Guides({ users, notify, reload }: GuidesProps) {
    const [editedGuide, seteditGuide] = useState<UserInfo | undefined>(undefined);
    
    let guides : UserInfo[] = users;

    function getNewGuideInfo() : UserInfo {
        return {
            fname: "",
            lname: "",
            displayName: "",
            avatar: {
                url: "",
                path: "",
            },
            type: UserType.PARTICIPANT,
        }
    }

    function afterEdit() {
        seteditGuide(undefined);
        if(reload) {
            //console.log("reloading!");
            reload();
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
        { editedGuide && <EditGuideInfo guide_info={editedGuide} afterSaved={afterEdit} />}
        {guides.map((m, i) => (
        <HBox key={i} onClick={()=>seteditGuide(m)}>
            {m.avatar && m.avatar.url && <img src={m.avatar.url} style={{ width: 40, height: 40 }} alt={"אין תמונה"}/>}
            <Spacer width={30}/>
            <Text width={"50vw"} textAlign="right">{m.fname + " " + m.lname}</Text>
            {(m.type === UserType.GUIDE) && <BusinessCenterIcon/>}
        </HBox>
        ))}
    </div>);

}