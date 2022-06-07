import { useEffect, useState } from 'react';
import * as api from './api'

import { ResponsiveTab, TabPanel } from './elem';
import Events from './events';

import { Tabs } from '@material-ui/core';
import { useLocation, useNavigate } from "react-router-dom";
import Media from './media';
import Guides from './guides';
import { AdminProps, MediaResource, UserInfo } from './types';
import { Colors } from './theme';


export default function Admin(props: AdminProps) {
    const [media, setMedia] = useState<MediaResource[]>([]);
    const [users, setUsers] = useState<UserInfo[]> ([]);
    const location = useLocation();
    const navigate = useNavigate();
    const [reloadMedia, setReloadMedia] = useState<number>(0);

    useEffect(() => {
        if (!props.connected)
            return;
        api.getMedia().then((m:MediaResource[]) => setMedia(m));
        api.getUsers().then((g:UserInfo[]) => setUsers(g));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.connected, reloadMedia]);

    let adminTab = location.hash ? parseInt(location.hash.substr(1)) : 0;
    return (<div dir="rtl" style={{height: "100vh", overflowY:"hidden"}}>
        <Tabs key={"100"}
            value={adminTab}
            onChange={(e, tab) => navigate("/admin#" + tab)}
            indicatorColor="primary"
            textColor="primary"
            scrollButtons="auto"
            centered
            style={{ marginTop: 5, backgroundColor:Colors.EventBackground, fontSize:25 }}
            TabIndicatorProps={{
                style: {
                    display: "none"
                }
            }}
        >
            <ResponsiveTab label={"יומן"} />
            
            <ResponsiveTab label={"מדיה"} />

            <ResponsiveTab label={"מנחים"} />
        </Tabs>
        <TabPanel key={"0"} value={adminTab} index={0} style={{ height: "80%" }}>
            <Events connected={props.connected} notify={props.notify} media={media} users={users}/>
        </TabPanel>
        
        <TabPanel key={"1"} value={adminTab} index={1} >
            {adminTab === 1 && <Media notify={props.notify} media={media} reload={()=>setReloadMedia(old=>old+1)}/>}
        </TabPanel>

        <TabPanel key={"2"} value={adminTab} index={2} >
            {adminTab === 2 && <Guides notify={props.notify} users={users} reload={()=>setReloadMedia(old=>old+1)}/>}
        </TabPanel>
    </div>);
}