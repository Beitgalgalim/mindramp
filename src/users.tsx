import { useState } from 'react';
import { UsersProps, UserInfo, UserType } from './types';
import { Text, HBox, Spacer } from './elem';
import { Fab, Grid } from '@mui/material';
import { Add } from '@mui/icons-material';
import EditUser from './edit-users';
import "./css/users.css"

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';
import Avatar from '@mui/material/Avatar';


export default function Users({ users, notify, reload, isAdmin }: UsersProps) {
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

        <div className="users-container">
            {editedUser && <EditUser userInfo={editedUser} afterSaved={afterEdit} notify={notify} isAdmin={isAdmin} />}
            {!editedUser &&
                <Fab
                    color="primary" aria-label="הוסף"
                    variant="circular"
                    style={{
                        position: "fixed",
                        bottom: 60,
                        right: 50,
                        zIndex: 1000,
                        borderRadius: '50%'
                    }}
                >
                    <Add onClick={() => { setEditedUser(getNewUserInfo()) }} />
                </Fab>
            }
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {users &&
                    users.sort(
                        (u1, u2) => u1.displayName.localeCompare(u2.displayName)
                    ).map((m, i) => (
                        <ListItem key={i} onClick={() => setEditedUser(m)} alignItems="flex-start" divider={true} >
                            <ListItemButton >
                                <ListItemAvatar>
                                    <Avatar src={m.avatar?.url} />
                                </ListItemAvatar>
                                <ListItemText>
                                    <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
                                        <Grid item xs={6}>
                                            <Text fontWeight="bold" fontSize="x-large">
                                                {m.displayName?.trim().length > 0 ? m.displayName : m._ref?.id}
                                            </Text>
                                        </Grid>
                                        <Grid item xs={6}>
                                            {(m.type === UserType.GUIDE) && <Text>מדריך</Text>}
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Text>{m._ref?.id}</Text>
                                        </Grid>

                                        <Grid item xs={6}>
                                            {m.phone && <Text>{m.phone}</Text>}
                                        </Grid>
                                    </Grid>
                                </ListItemText>
                            </ListItemButton>
                        </ListItem>
                    ))}
            </List>
        </div>
    );

}