import { useEffect, useState } from 'react';
import * as api from './api'

import { Text, ResponsiveTab, TabPanel } from './elem';
import Events from './events';

import { Tabs } from '@material-ui/core';
import { useLocation, useNavigate } from "react-router-dom";
import Media from './media';
import { MediaResource } from './types';


export default function Admin(props: any) {
    const [media, setMedia] = useState<MediaResource[]>([]);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (!props.connected)
            return;
        api.getMedia().then((m:MediaResource[]) => setMedia(m));

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.connected]);

    let adminTab = location.hash ? parseInt(location.hash.substr(1)) : 0;
    return (<div dir="rtl">
        <Tabs key={"100"}
            value={adminTab}
            onChange={(e, tab) => navigate("/admin#" + tab)}
            indicatorColor="primary"
            textColor="primary"
            scrollButtons="auto"
            centered
            style={{ marginTop: 5 }}
            TabIndicatorProps={{
                style: {
                    display: "none"
                }
            }}
        >
            <ResponsiveTab label={"אירועים"} />
            <ResponsiveTab label={"תבנית אירועים"} />
            <ResponsiveTab label={"מדיה"} />
        </Tabs>
        <TabPanel key={"0"} value={adminTab} index={0} style={{ height: "80%" }}>
            <Events connected={props.connected} notify={props.notify} media={media}/>
        </TabPanel>
        <TabPanel key={"1"} value={adminTab} index={1} >
            {adminTab === 1 && <Text>הי</Text>}
        </TabPanel>
        <TabPanel key={"2"} value={adminTab} index={2} >
            {adminTab === 2 && <Media connected={props.connected} notify={props.notify} media={media}/>}
        </TabPanel>

    </div>);
}