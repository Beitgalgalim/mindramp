
import React, { useEffect } from 'react';
import {
    Box, ListItemButton, Typography
} from '@mui/material';
import {
    ClickAwayListener,
    ListItem,
    ListItemText,
    Popper,
    Tab
} from '@material-ui/core';

import {

    withStyles
} from "@material-ui/core/styles";

import { FixedSizeList } from 'react-window';
import { ExpandMore } from '@mui/icons-material';
import { EventMountArg } from '@fullcalendar/common'

export const ResponsiveTab = withStyles({
    root: {
        minWidth: 150
    },
    selected: {

    },
    textColorPrimary: {
        color: "#737373",
        '&$selected': {
            color: "#3D95EE",
            FontFace: "bold",
            textDecoration: "underline"
        }
    },
})(Tab);

export function Card(props: any) {
    return <Box style={{
        display: 'flex',
        width: props.width || '94%',
        marginRight: '3%',
        marginLeft: '3%',
        marginBottom: 10,
        borderRadius: 4,
        flexDirection: 'column',
        alignItems: 'center',
        backgroundColor: 'white',
        boxShadow: "1px 2px 1px #9E9E9E",
        ...props.style
    }}>
        {props.children}
    </Box>
}

export function VBox(props: any) {
    return <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', ...props.style }}>
        {props.children}
    </Box>
}

export const ClickableText = React.forwardRef((props: any, ref: any) => {
    const { onClick, onChange, onBlur, invalid } = props;
    return (
        <HBoxC  onClick={onClick} ><input
            style={{ borderWidth:0, backgroundColor: (invalid ? "red" : "transparent"), width: 80 }}
            type="text"
            ref={ref}
            readOnly={props.readOnly === true}
            onMouseOver={(e) => { if (!invalid) e.currentTarget.style.backgroundColor = 'lightgray' }}
            onMouseLeave={(e) => { if (!invalid) e.currentTarget.style.backgroundColor = 'transparent' }}
            onBlur={(e) => onBlur && onBlur(e.currentTarget.value)}
            onChange={(e) => onChange && onChange(e.currentTarget.value)}
            value={props.value}
            />

            <ExpandMore />
        </HBoxC>);
});

export function ComboBox(props: any) {
    const { items, value } = props;
    const [open, setOpen] = React.useState(false);
    const [localValue, setLocalValue] = React.useState<string>("");

    const localElRef = React.useRef<HTMLDivElement | null>(null);
    const currentIndex = items.findIndex((item: any) => item === value);

    const handleElClick = () => {
        setOpen(true);
    }

    useEffect(() => {
        if (props.elRef && props.elRef.current != null) {
            props.elRef.current.onclick = handleElClick;
        }
    }, [props?.elRef?.current])

    useEffect(() => {
        setLocalValue(props.value);
    }, [props.value])

    const renderItem = ({ index, style }: { index: number, style: any }) => (
        <ListItem style={{ ...style, padding: 0 }} key={index} selected={currentIndex === index} >
            <ListItemButton style={{ padding: 0 }}
                onClick={() => props.onSelect(items[index])}>
                <ListItemText
                    disableTypography
                    primary={<Typography style={{ fontSize: 12 }}>{items[index]}</Typography>}
                />
            </ListItemButton>
        </ListItem>
    );



    return <ClickAwayListener onClickAway={() => setOpen(false)} >
        <div>
            {!props.elRef && <ClickableText
                ref={localElRef}
                onClick={() => {
                    setOpen(true)
                }}
                onChange={(newVal: string) => setLocalValue(newVal)}
                onBlur={(newVal: string) => props.onChange && props.onChange(newVal)}
                value={localValue}
                readOnly={props.readOnly === true} 
                invalid={props.invalid}
            />
            }
            <Popper
                open={open}
                anchorEl={props.elRef ? props.elRef.current : localElRef.current}
                transition disablePortal style={{ zIndex: 1001, backgroundColor: 'white' }}>

                <FixedSizeList
                    itemCount={items.length}
                    height={Math.min(items.length * 25, 150)}
                    width={70}
                    itemSize={25}
                    initialScrollOffset={currentIndex > 0 ? currentIndex * 25 : 0}>
                    {renderItem}
                </FixedSizeList>
            </Popper>
        </div>
    </ClickAwayListener>
}

export const VBoxC = (props: any) => (<VBox style={{ alignItems: "center", justifyContent: "center", width: "100%", ...props.style }} >{props.children}</VBox>);


export const HBoxC = (props: any) => (<HBox style={{ alignItems: "center", justifyContent: "center", width: "100%", ...props.style }} onClick={props.onClick}>{props.children}</HBox>);
export const HBoxSB = (props: any) => (<HBox style={{ alignItems: "center", justifyContent: "space-between", width: "100%", ...props.style }} >{props.children}</HBox>);


export function HBox(props: any) {
    return <Box style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', ...props.style }}
            onClick={props.onClick}>
        {props.children}
    </Box>
}

export function Spacer(props: any) {
    return <div style={{ width: props.width || 5, height: props.height || 5 }} />
}

export function Toolbar(props: any) {
    return <div style={{ flex: 1, flexDirection: 'row', height: 30, alignItems: 'flex-start' }}>{props.children}</div>
}

export function TabPanel(props: any) {
    const { children, value, index, style, ...other } = props;

    return (
        <Typography
            component="div"
            role="tabpanel"
            hidden={value !== index}
            id={`scrollable-auto-tabpanel-${index}`}
            {...other}
            style={{ ...style, padding: 0 }}
        >
            {props.title ? <h1 style={{ textAlign: "center" }}>{props.title}</h1> : null}
            <Box style={{ padding: 2 }} p={3}>{children}</Box>
        </Typography>
    );
}


export function Text(props: any) {
    return <div style={{
        width: props.width || '100%',
        textAlign: props.textAlign || 'right',
        alignSelf: props.alignSelf || undefined,
        fontSize: props.fontSize || 12,
        fontWeight: props.fontWeight,
        textDecoration: props.textDecoration,
        lineHeight: props.lineHeight,
        marginTop: props.marginTop,
        padding: 0,
        backgroundColor: props.backgroundColor,
        color: props.color,
        transform: props.transform || undefined
    }}
        onClick={props.onClick}
    >{props.children}</div>
}


export function HourLines({ sliceWidth, height, hours, sliceEachHour }:
    { sliceWidth: number, height: number, hours: string[], sliceEachHour: number }) {

    const items: JSX.Element[] = [];

    hours.forEach((h, i) => {
        for (let j = 0; j < sliceEachHour; j++) {
            items.push(<div key={(i * 100) + j} style={{
                display: "flex",
                width: sliceWidth,
                height,
                flexDirection: "column",
                alignItems: "center",
                color: "white",
                opacity: 1,

            }}

            >
                {j % sliceEachHour === 0 ? h : <Spacer height={20} />}
                <div style={{
                    border: 0, borderLeft: 2, borderStyle: "solid",
                    borderColor: "white", height: window.innerHeight - 20, width: 1
                }} />

            </div>);
        }
    });

    return (
        <div style={{ display: "flex", flexDirection: "row", backgroundColor: "gray", opacity: 0.4 }}>
            {items}
        </div>
    );
}

export function addRepeatIcon(info: EventMountArg) {
    let timeDiv = info.el.getElementsByClassName("fc-event-time");
    if (timeDiv.length > 0) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', "svg");
        svg.setAttributeNS(null, "viewBox", "0 0 24 24");
        svg.setAttributeNS(null, "width", "15");
        svg.setAttributeNS(null, "height", "15");
        svg.setAttributeNS(null, "fill", "white");
        svg.style.display = "block";
        const path = document.createElementNS('http://www.w3.org/2000/svg', "path");
        console.log("aa")
        if (info.event.extendedProps?.instanceStatus) {
            path.setAttribute("d", "M3 2 L24 23 L23 24 L2 3zM21 12V6c0-1.1-.9-2-2-2h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H5V10h14v2h2zm-5.36 8c.43 1.45 1.77 2.5 3.36 2.5 1.93 0 3.5-1.57 3.5-3.5s-1.57-3.5-3.5-3.5c-.95 0-1.82.38-2.45 1H18V18h-4v-4h1.5v1.43c.9-.88 2.14-1.43 3.5-1.43 2.76 0 5 2.24 5 5s-2.24 5-5 5c-2.42 0-4.44-1.72-4.9-4h1.54z");
        } else {
            path.setAttribute("d", "M21 12V6c0-1.1-.9-2-2-2h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h7v-2H5V10h14v2h2zm-5.36 8c.43 1.45 1.77 2.5 3.36 2.5 1.93 0 3.5-1.57 3.5-3.5s-1.57-3.5-3.5-3.5c-.95 0-1.82.38-2.45 1H18V18h-4v-4h1.5v1.43c.9-.88 2.14-1.43 3.5-1.43 2.76 0 5 2.24 5 5s-2.24 5-5 5c-2.42 0-4.44-1.72-4.9-4h1.54z");
        }
        svg.appendChild(path)

        timeDiv[0].prepend(svg);
        timeDiv[0].setAttribute("style", "display: flex; flex-direction: row;")
    }
}
