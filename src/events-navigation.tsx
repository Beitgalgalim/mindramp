import React, { useEffect, useState } from 'react';

const Button = ({caption, selected}:{caption:string, selected?:boolean})=> {
    return <div style={{
        backgroundColor: selected?"#337F5B":"#DEE6EA",
        borderRadius: 40,
        width: 120,
        height: 46,
        color: selected? "white":"#495D68",
        //fontFamily: "Assistant",
        //fontWeight: 700,
        fontSize: "1em",
        lineHeight: "1.8em",
        textAlign: "center",
    }} >{caption}</div>
}

export default function EventsNavigation() {
    return <div style={{
        display:"flex",
        flexDirection: "row",
        justifyContent:"space-evenly",
        width:"100%",
        paddingTop:25,
        paddingBottom:20,
    }}>
        <Button caption={"היום"} selected={true}/>
        <Button caption={"מחר"} />
        <Button caption={"מחרתיים"} />
    </div>
}