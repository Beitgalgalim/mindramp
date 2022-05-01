import { Cancel, Check } from '@mui/icons-material';
import { TextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { HBox, HBoxC, Spacer, Text, VBox } from './elem';
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

    }, [click]);

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
        fontSize: '2rem',
        color: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 15, marginLeft: 15,
    }}>

        {!personalize && <Text>{headerMsg}</Text>}
        {
            personalize &&
            <HBoxC style={{ zIndex: 100 }}>
                <TextField
                    label="שם"
                    variant="outlined"
                    sx={{
                        ".MuiInputBase-input": {
                            padding: '1px 3px',
                            fontSize: '2rem',
                            color: "white",
                            lineHeight: '1.25rem',
                        },
                        ".MuiInputLabel-root": {
                            fontSize: '1.7rem',
                            color: "white",
                            top: -5,
                        },
                        ".MuiFormControl-root": {
                            width: "40vw",
                        }

                    }}


                    //style={{ fontSize: 50, textAlign: "right", direction: "rtl", borderColor: 'black' }}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                />
                <VBox>
                    <Spacer />
                    <Check style={{ fontSize: 45 }} onClick={() => {
                        savePersonalization(editName);
                        setPersonalize(false);
                    }} />
                    <Cancel style={{ fontSize: 45 }} onClick={() => setPersonalize(false)} />
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