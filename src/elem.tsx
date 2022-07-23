
import React, { MutableRefObject, ReactElement, useEffect } from 'react';
import {
    Box, ListItemButton, TextField, Typography, InputAdornment,
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
import { ExpandMore, PersonOutlined, StarRate } from '@mui/icons-material';
import { EventMountArg } from '@fullcalendar/common'
import { HourLinesProps } from './types';
import { Colors } from './theme';
import "./elem.css";



export const ResponsiveTab = withStyles({
    root: {
        minWidth: 70,
    },
    selected: {

    },
    textColorPrimary: {
        color: "#737373",
        fontSize: 25,
        '&$selected': {
            backgroundColor: "#A8A8A8",
            //FontFace: "bold",
            //textDecoration: "underline"
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
    const { onClick, onChange, onBlur, invalid, onArrowUp, onArrowDown, placeholder, showExpand } = props;
    return (
        //<HBoxC onClick={onClick} style={{ width: "100%" }}>
        <TextField
            hiddenLabel
            variant="standard"
            onClick={onClick}
            style={{
                //width: "80%",
                height: 30,
                borderWidth: 0,
                //borderRadius: 4,
                backgroundColor: (invalid ? "red" : "transparent"),
                direction: props.style?.textAlign === "right" ? "rtl" : "ltr",
                textAlign: props.style?.textAlign || "left"
            }}
            placeholder={placeholder}
            type="text"
            ref={ref}
            InputProps={{
                readOnly: props.readOnly === true,
                startAdornment: showExpand && (
                    <InputAdornment position="end" sx={{ margin: 0 }}>
                        <ExpandMore />
                    </InputAdornment>
                ),
            }}
            onMouseOver={(e) => {
                if (!invalid) e.currentTarget.style.backgroundColor = 'lightgray';
                //e.currentTarget.style.textDecoration = "underline";
            }}
            onMouseLeave={(e) => {
                if (!invalid) e.currentTarget.style.backgroundColor = 'transparent'
                //e.currentTarget.style.textDecoration = "none";
            }}
            onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                    if (onArrowDown) onArrowDown();
                } else if (e.key === "ArrowUp") {
                    if (onArrowUp) onArrowUp();
                }
            }}
            onBlur={(e) => onBlur && onBlur(e.currentTarget.value)}
            onChange={(e) => onChange && onChange(e.currentTarget.value)}
            value={props.value}
        />

    );
});


export type ComboBoxItem = string | {
    key: string,
    value: string,
    icon?: string
}

export interface ComboBoxProps {
    items: ComboBoxItem[],
    value?: string, //actual value or key if an item in items
    onSelect: (itemKey: string) => void,
    onChange?: (newVal: string) => void,
    elRef?: MutableRefObject<HTMLElement>,
    style?: any,
    readOnly?: boolean,
    invalid?: boolean,
    filterItem?: (item: ComboBoxItem, txtValue: string) => boolean,
    renderItem?: (item: ComboBoxItem, hoover: boolean, selected: boolean) => ReactElement,
    itemHeight?: number,
    listHeight?: number,
    listWidth?: number,
    placeholder?: string,
    hideExpandButton?: boolean,
}


export function ComboBox(props: ComboBoxProps) {
    const { style, filterItem, itemHeight, listHeight, onSelect, onChange, placeholder, hideExpandButton, listWidth } = props;
    const [open, setOpen] = React.useState(false);
    const [localValue, setLocalValue] = React.useState<string>("");
    const [hoverItem, setHoverItem] = React.useState<number>(-1);

    const localElRef = React.useRef<HTMLDivElement | null>(null);
    const currentIndex = props.items.findIndex((item: any) => item === props.value || item?.key === props.value);

    const handleElClick = () => {
        setOpen(true);
    }

    useEffect(() => {
        if (props.elRef && props.elRef.current != null) {
            props.elRef.current.onclick = handleElClick;
        }
    }, [props.elRef])

    useEffect(() => {
        const item = props.items.find((item: any) => item.key === props.value);
        if (item) {
            setLocalValue((item as any).value);
            console.log("setLocalValue", props.value)
        } else {
            setLocalValue(props.value || "");
            console.log("setLocalValue", props.value)

        }
    }, [props.value])

    const items = filterItem ? props.items.filter((item: any) => filterItem(item, localValue)) : props.items;

    const renderItems = (renderProps: any) => {
        let key: string, txtValue: string;
        if (typeof items[renderProps.index] == "string") {
            key = items[renderProps.index] as string;
            txtValue = key;
        } else {
            key = (items[renderProps.index] as any).key
            txtValue = (items[renderProps.index] as any).value;
        }


        return <ListItem style={{ padding: 0, ...renderProps.style }}
            key={renderProps.index}
            selected={currentIndex === renderProps.index}
        >
            <ListItemButton style={{ padding: 0 }}
                onMouseEnter={() => setHoverItem(renderProps.index)}
                onMouseLeave={() => setHoverItem(-1)}
                onClick={() => onSelect(key)}>
                <ListItemText
                    disableTypography
                    primary={
                        props.renderItem ?
                            props.renderItem(items[renderProps.index], hoverItem === renderProps.index, false) :
                            <Text style={{ fontSize: 12, textAlign: style?.textAlign || "left" }}>
                                {txtValue}
                            </Text>
                    }
                />
            </ListItemButton>
        </ListItem>
    };

    const itemSize = itemHeight || 25;
    const listSize = Math.min(items.length * (itemSize), (listHeight || 150))

    let value = props.value;
    if (items.length > 0 && typeof items[0] !== "string") {
        const foundItem = items.find((item: ComboBoxItem) => typeof item !== "string" && item.key === props.value);
        if (foundItem) {
            value = (foundItem as any).value;
        }
    }


    return <ClickAwayListener onClickAway={() => setOpen(false)} >
        <div style={{ display: "flex", ...style }}>
            {!props.elRef &&
                <ClickableText
                    showExpand={!hideExpandButton}
                    style={{ width: "70%", ...style }}
                    ref={localElRef}
                    onClick={() => {
                        setOpen(true)
                    }}
                    onChange={(newVal: string) => setLocalValue(newVal)}
                    onBlur={(newVal: string) => {
                        // check if value changed before firing event
                        if (newVal !== value) {
                            onChange && onChange(newVal)
                        }
                    }
                    }
                    placeholder={placeholder}
                    value={localValue}
                    readOnly={props.readOnly === true}
                    invalid={props.invalid}
                    onArrowUp={() => console.log("up")}
                    onArrowDown={() => console.log("down")}
                />
            }
            <Popper
                open={open && items.length > 0}
                anchorEl={props.elRef ? props.elRef.current : localElRef.current}
                transition disablePortal
                style={{
                    zIndex: 1001,
                    backgroundColor: 'lightgray',
                    padding: 2,
                    borderRadius: 3,
                    minWidth: 80,
                    minHeight: listSize,
                    scrollbarWidth: "thin",
                    boxShadow: "0px 18px 22px rgba(44, 85, 102, 0.12)",
                    overflow: "scroll",

                }}>

                <FixedSizeList
                    itemCount={items.length}
                    height={listSize}
                    width={listWidth || 100}
                    direction={style?.textAlign === "right" ? "rtl" : "ltr"}
                    itemSize={itemSize}
                    initialScrollOffset={currentIndex > 0 ? currentIndex * (itemSize) : 0}>
                    {renderItems}
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

export function Avatar({ size, imageSrc }: { size: number, imageSrc: string | undefined }) {
    if (!imageSrc)
        return <PersonOutlined style={{ borderRadius: size / 2, width: size, height: size }} />

    return <img src={imageSrc}
        className={"cover"}
        alt="" style={{ borderRadius: size / 2, width: size, height: size }} />
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
    return <div
        role={props.role}
        aria-label={props["aria-label"]}
        aria-hidden={props["aria-hidden"]}
        style={{
            width: props.width || '100%',
            textAlign: props.textAlign || 'right',
            alignSelf: props.alignSelf || undefined,
            fontSize: props.fontSize,
            fontWeight: props.fontWeight,
            textDecoration: props.textDecoration,
            lineHeight: props.lineHeight,
            marginTop: props.marginTop,
            padding: 0,
            backgroundColor: props.backgroundColor,
            color: props.color,
            transform: props.transform || undefined
        }
        }
        onClick={props.onClick}
    > {props.children}</div >
}

export function EventsMain({ children, height, width, style }: any) {
    return <div style={{
        width: width || window.innerWidth,
        height,
        backgroundColor: Colors.EventBackground,
        borderTopRightRadius: 40,
        borderTopLeftRadius: 40,
        ...style
    }}>
        {children}
    </div>
}


export function EventProgress(props: any) {
    const pastColor = "#6F9CB6";
    const futureColor = "#CCDEE9";

    const progress = Math.min(props.progress, 1);

    return <div style={{ width: "100%", display: "flex", flexDirection: "row", alignItems: "center" }}>
        <div aria-hidden="true" dir="rtl" style={{
            width: (progress * 100) + "%",
            height: 5,
            borderTopRightRadius: 5,
            borderBottomRightRadius: 5,
            backgroundColor: pastColor
        }} />
        <Spacer width={2} />
        <div aria-hidden="true" dir="rtl" style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: pastColor
        }} />
        <Spacer width={2} />
        <div aria-hidden="true" dir="rtl" style={{
            width: ((1 - progress) * 100) + "%",
            height: 5,
            borderTopLeftRadius: 5,
            borderBottomLeftRadius: 5,
            backgroundColor: futureColor
        }} />
    </div >
}

export function NowLine({ offset, length, start, vertical }: { offset: number, length: number, start: number, vertical: boolean }) {
    const borderStyle = vertical ?
        "solid none none" :
        "none none none solid"

    return <div aria-hidden="true" dir="rtl" style={{
        position: "absolute",
        right: vertical ? 0 : offset,
        top: vertical ? start + offset : start,
        width: vertical ? length : 5,
        borderWidth: 5,
        borderStyle,
        borderColor: "white",
        height: vertical ? 5 : length,
        zIndex: 1500,
        opacity: 0.7,
    }} />
}

export function UnRead(props: any) {
    return <div style={{
        display: "flex", flexDirection: "row",
        position: "absolute", right: 5,
        top: 5, width: 100,
        color: "gold",
        zIndex: 1000,
    }}>
        <StarRate />
    </div>
}

export function HourLines({ sliceWidth, height, hours, sliceEachHour, vertical, windowSize }: HourLinesProps) {

    const items: JSX.Element[] = [];
    if (vertical) {
        //swap height and width
        const t = height;
        height = sliceWidth;
        sliceWidth = t;
    }
    const borderStyle = vertical ?
        "solid none none" :
        "none none none solid"


    hours.forEach((h, i) => {
        for (let j = 0; j < sliceEachHour; j++) {
            items.push(<div key={(i * 100) + j} style={{
                display: "flex",
                width: sliceWidth,
                height,
                flexDirection: vertical ? "row" : "column",
                alignItems: "center",
                color: "white",
                opacity: 1,

            }}

            >
                {j % sliceEachHour === 0 ? h : <Spacer height={20} />}
                <div style={{
                    borderWidth: 1,
                    borderStyle,
                    borderColor: "white",
                    height: vertical ? 1 : windowSize.h - 20,
                    width: vertical ? windowSize.w - 20 : 1,
                }} />

            </div>);
        }
    });

    return (
        <div style={{ display: "flex", flexDirection: vertical ? "column" : "row", backgroundColor: "gray", opacity: 0.4 }}
            aria-hidden="true">
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

export function addParticipantsIcon(info: EventMountArg) {
    let mainDiv = info.el.getElementsByClassName("fc-event-main");
    if (mainDiv.length > 0) {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', "svg");
        svg.setAttributeNS(null, "viewBox", "0 0 24 24");
        svg.setAttributeNS(null, "width", "15");
        svg.setAttributeNS(null, "height", "15");
        svg.setAttributeNS(null, "fill", "white");
        svg.style.display = "block";
        svg.style.position = "absolute";
        svg.style.left = "0";
        const path = document.createElementNS('http://www.w3.org/2000/svg', "path");
        path.setAttribute("d", "M 16.5 13 c -1.2 0 -3.07 0.34 -4.5 1 c -1.43 -0.67 -3.3 -1 -4.5 -1 C 5.33 13 1 14.08 1 16.25 V 19 h 22 v -2.75 c 0 -2.17 -4.33 -3.25 -6.5 -3.25 Z m -4 4.5 h -10 v -1.25 c 0 -0.54 2.56 -1.75 5 -1.75 s 5 1.21 5 1.75 v 1.25 Z m 9 0 H 14 v -1.25 c 0 -0.46 -0.2 -0.86 -0.52 -1.22 c 0.88 -0.3 1.96 -0.53 3.02 -0.53 c 2.44 0 5 1.21 5 1.75 v 1.25 Z M 7.5 12 c 1.93 0 3.5 -1.57 3.5 -3.5 S 9.43 5 7.5 5 S 4 6.57 4 8.5 S 5.57 12 7.5 12 Z m 0 -5.5 c 1.1 0 2 0.9 2 2 s -0.9 2 -2 2 s -2 -0.9 -2 -2 s 0.9 -2 2 -2 Z m 9 5.5 c 1.93 0 3.5 -1.57 3.5 -3.5 S 18.43 5 16.5 5 S 13 6.57 13 8.5 s 1.57 3.5 3.5 3.5 Z m 0 -5.5 c 1.1 0 2 0.9 2 2 s -0.9 2 -2 2 s -2 -0.9 -2 -2 s 0.9 -2 2 -2 Z");
        svg.appendChild(path)

        mainDiv[0].append(svg);
        mainDiv[0].setAttribute("style", "display: flex; flex-direction: row;")
    }
}


export const Style = {
    hidden: {
        position: "fixed",
        left: -1000,
        width: 10
    } as React.CSSProperties
};