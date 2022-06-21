import { useState } from 'react';
import { GuidesProps, UserInfo, UserType } from './types';
import EditGuideInfo from './edit-guide-info';
import { Text, HBox, Spacer, Avatar } from './elem';
import { Fab } from '@mui/material';
import { Add } from '@mui/icons-material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';

export default function Guides({ users, notify, reload }: GuidesProps) {
    const [editedGuide, seteditGuide] = useState<UserInfo | undefined>(undefined);

    function getNewGuideInfo(): UserInfo {
        return {
            fname: "",
            lname: "",
            displayName: "",
            type: UserType.PARTICIPANT,
        }
    }

    function afterEdit() {
        seteditGuide(undefined);
        if (reload) {
            reload();
        }
    }

    return (

        <div dir="rtl">
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
                    <Add onClick={() => { seteditGuide(getNewGuideInfo()) }} />
                </Fab>
            }
            {editedGuide && <EditGuideInfo guide_info={editedGuide} afterSaved={afterEdit} notify={notify} />}
            {users && users.map((m, i) => (
                <HBox key={i} onClick={() => seteditGuide(m)} style={{alignItems:"center"}}>
                    <Avatar imageSrc={m.avatar?.url} size={40} />
                    <Spacer width={30} />
                    <Text width={"50vw"} textAlign="right">{
                    m.displayName?.trim().length > 0? m.displayName: m._ref?.id
                    }</Text>
                    {(m.type === UserType.GUIDE) && <BusinessCenterIcon />}
                </HBox>
            ))}
        </div>);

}