import { useEffect, useState } from 'react';

import { Text, HBox, Spacer, ResponsiveTab, TabPanel } from './elem';
import Events from './events';

import { Tabs } from '@material-ui/core';
import {  useLocation, useNavigate } from "react-router-dom";


export default function Admin(props: any) {

    const location = useLocation();
    const navigate = useNavigate();


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
            <ResponsiveTab label={"סמלילים"} />
            <ResponsiveTab label={"תמונות"} />
        </Tabs>,
        <TabPanel key={"0"} value={adminTab} index={0} >
            {adminTab === 0 ? <Events connected={props.connected} notify={props.notify} /> : null}
        </TabPanel>
        <TabPanel key={"1"} value={adminTab} index={1} >
            {adminTab === 1 ? <Text>הי</Text>: null}
        </TabPanel>
    </div>);
}