import { useEffect, useState } from 'react';
import { UsersProps, UserInfo, UserType, RoleRecord } from './types';
import * as api from "./api";

import { Text, HBox, Spacer, FloatingAdd } from './elem';
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


export default function Users({ user, users, notify, reload, roles }: UsersProps) {
    const [editedUser, setEditedUser] = useState<UserInfo | undefined>(undefined);
    const [roleRecords, setRoleRecords] = useState<RoleRecord[]>([]);
    const [reloadRoles, setReloadRoles] = useState<number>(0);
    const [filter, setFilter] = useState<string>("");

    useEffect(() => {
        api.getRoles().then(roleRecs => {
            setRoleRecords(roleRecs);
        });
    }, [user, reloadRoles]);


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
        setReloadRoles(prev=>prev+1);
    }

    return (

        <div className="users-container">
            {editedUser && <EditUser user={user} userInfo={editedUser} afterSaved={afterEdit} notify={notify} roles={roles} roleRecords={roleRecords}  />}
            {!editedUser && <FloatingAdd onClick={() => setEditedUser(getNewUserInfo())} />
               
            }
            <div className="users-search">
                <div>חיפוש</div>
                <input type="search" onChange={(e)=>setFilter(e.target.value)}/>
            </div>
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                {users &&
                    users.filter(u=>filter.length == 0 || u.displayName.includes(filter)).
                    sort(
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