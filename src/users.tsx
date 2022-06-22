import { useState } from 'react';
import { UsersProps, UserInfo, UserType } from './types';
import { Text, HBox, Spacer, Avatar } from './elem';
import { Fab } from '@mui/material';
import { Add } from '@mui/icons-material';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import EditUser from './edit-users';

export default function Users({ users, notify, reload }: UsersProps) {
    const [editedUser, setEditedUser] = useState<UserInfo | undefined>(undefined);

    function getNewUserInfo(): UserInfo {
        return {
            fname: "",
            lname: "",
            displayName: "",
            type: UserType.PARTICIPANT,
        }
    }

    function afterEdit() {
        setEditedUser(undefined);
        if (reload) {
            reload();
        }
    }

    return (

        <div dir="rtl">
            {!editedUser &&
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
                    <Add onClick={() => { setEditedUser(getNewUserInfo()) }} />
                </Fab>
            }
            {editedUser && <EditUser userInfo={editedUser} afterSaved={afterEdit} notify={notify} />}
            {users && users.map((m, i) => (
                <HBox key={i} onClick={() => setEditedUser(m)} style={{alignItems:"center"}}>
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