import { Cancel, Check } from '@mui/icons-material';
import { TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { HBoxC, Spacer, Text, VBox } from './elem';
const logo = require("./logo-small.png");

function useSingleAndDoubleClick(onDoubleClick: CallableFunction, onClick?: CallableFunction, delay = 250) {
    const [click, setClick] = useState<number>(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            // simple click
            if (click === 1 && onClick) onClick();
            setClick(0);
        }, delay);

        // the duration between this click and the previous one
        // is less than the value of delay = double-click
        if (click === 2) onDoubleClick();

        return () => clearTimeout(timer);

    }, [click, delay, onClick, onDoubleClick]);

    return () => setClick(prev => prev + 1);
}

export default function EventsHeader(props: any) {
    const [personalize, setPersonalize] = useState<boolean>(false);
    const [name, setName] = useState<string | null>(null);
    const [editName, setEditName] = useState<string | null>(null);

    useEffect(() => {
        // Init personalized name on mount
        const savedState = localStorage.getItem("state");
        if (savedState && savedState.length > 0) {
            const obj = JSON.parse(savedState)
            setName(obj.name);
            setEditName(obj.name);
        }
    }, [])

    const savePersonalization = (value: string | null) => {
        if (value) {
            const state = { name: value }
            localStorage.setItem("state", JSON.stringify(state));
            setName(value);
        }
    }

    const handleClick = useSingleAndDoubleClick(() => {
        // Double click
        setPersonalize(true);
    }, undefined, 350);

    let headerMsg = name ? "הי " + name : "";

    if (props.showDateTime) {
        const h = props.showDateTime.hour();
        if (headerMsg.length > 0) headerMsg += ", ";

        if (h > 6 && h < 12) {
            headerMsg += "בוקר טוב";
        } else if (h >= 12 && h <= 17) {
            headerMsg += "צהריים טובים";
        } else if (h > 17 && h < 21) {
            headerMsg += "ערב טוב";
        } else {
            headerMsg += "לילה טוב";
        }
    }

    return <div style={{
        height: props.height,
        fontSize: '1.9rem',
        fontWeight: 900,
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15, marginLeft: 15,
    }}>

        {!personalize && <Text>{headerMsg}</Text>}
        {
            personalize &&
            <HBoxC style={{ zIndex: 100}}>
                <TextField
                    label="שם"
                    variant="outlined"
                    dir="rtl"
                    sx={{
                        ".MuiInputBase-input": {
                            padding: '1px 3px',
                            fontFamily: "Assistant",
                            fontWeight: 900,
                            fontSize: '1.8rem',
                            color: "white",
                            borderStyle:"solid",
                            borderColor:"white",
                            borderRadius:3,
                            borderWidth:2,
                            //lineHeight: '1.25rem',
                            margin:2,
                        },
                        ".MuiInputLabel-root": {
                            fontSize: '1.7rem',
                            color: "white",
                            top: 1,
                            left:10,
                        },
                        ".MuiFormControl-root": {
                            width: "40vw",
                            borderStyle:"none",
                        }

                    }}


                    //style={{ fontSize: 50, textAlign: "right", direction: "rtl", borderColor: 'black' }}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                />
                <VBox>
                    <Spacer />
                    <Check style={{ fontSize: 40 }} onClick={() => {
                        savePersonalization(editName);
                        setPersonalize(false);
                    }} />
                    <Cancel style={{ fontSize: 40 }} onClick={() => setPersonalize(false)} />
                </VBox>
            </HBoxC>
        }
        {!personalize && <img
            src={logo}
            style={{ height: 60, borderRadius: 7 }}
            onClick={handleClick}
            alt={"לוגו של בית הגלגלים"}
            aria-hidden="true" />
        }
    </div>
}