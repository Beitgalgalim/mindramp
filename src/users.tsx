import { useState } from 'react';
import { UsersProps, UserInfo, UserType } from './types';
import { Text, HBox, Spacer, Avatar } from './elem';
import { Fab, Grid } from '@mui/material';
import { Add } from '@mui/icons-material';
import EditUser from './edit-users';
import "./css/users.css"

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
        <div>
            {editedUser && <EditUser userInfo={editedUser} afterSaved={afterEdit} notify={notify} />}

            <div className="users-container">
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
                <Grid container>
                    {users && users.map((m, i) => (
                        <Grid item key={i} onClick={() => setEditedUser(m)} xs={12}>
                            <Grid container>
                                <Grid item xs={3}>
                                    <Avatar imageSrc={m.avatar?.url} size={40} />
                                </Grid>
                                <Grid item xs={6}>
                                    <Text width={"50vw"} textAlign="right">
                                        {m.displayName?.trim().length > 0 ? m.displayName : m._ref?.id}
                                    </Text>
                                </Grid>
                                <Grid item xs={3}>
                                    {(m.type === UserType.GUIDE) && <Text>מדריך\ה</Text>}
                                </Grid>
                            </Grid>
                        </Grid>
                    ))}
                </Grid>
            </div>
        </div>);

}