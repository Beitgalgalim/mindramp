
import React, { MutableRefObject, ReactElement, useEffect } from 'react';
import {
    Box, ListItemButton, TextField, Typography, InputAdornment, Fab, IconButton,
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
import { Add, Close, ExpandLess, ExpandMore, PersonOutlined, StarRate } from '@mui/icons-material';
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
    const { onClick, onChange, onBlur, invalid, onArrowUp, onArrowDown, placeholder, showExpand, setOpen, open, readOnly } = props;
    console.log("ClickableText", readOnly)
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
                disabled: readOnly,
                startAdornment: showExpand && (
                    // <InputAdornment position="end" sx={{ margin: 0 }} onClick={()=>setOpen || setOpen(!open)}>
                    //     <ExpandMore />
                    // </InputAdornment>
                    <InputAdornment position="end">
                        <IconButton
                            edge="end"
                            onClick={(e) => {
                                console.log("click", open)
                                if (setOpen) setOpen(!open)
                                e.stopPropagation()
                            }}
                        >
                            {open ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                    </InputAdornment >
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
    const { style, filterItem, itemHeight, listHeight, onSelect, onChange, placeholder, hideExpandButton, listWidth, readOnly } = props;
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
                    setOpen={(o:boolean)=>setOpen(o)}
                    open={open}
                    placeholder={placeholder}
                    value={localValue}
                    readOnly={readOnly}
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
    const style = { borderRadius: size / 2, width: size, height: size };

    if (!imageSrc)
        return <PersonOutlined style={style} />

    return <img src={imageSrc} style={style}
        className={"cover"}
        alt="" />
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
        aria-role={props["aria-role"]}
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
    return <div
        style={{
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
    const progress = Math.min(props.progress, 1) * 100;

    return <div className="event-progress"
        style={{
            background: progress >= 0 ?
                `linear-gradient(to left,#6F9CB6 ${progress}%, white ${progress}% 100%)` :
                "CCDEE9",
        }}>

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



export function Modal(props: any) {
    return <div className="modal-outer" onClick={props.onClose}>
        <div className={props.className} style={{ position: "absolute" }} onClick={(evt) => evt.stopPropagation()}>
            <div className="modal-close-btn" onClick={props.onClose}><Close /> </div>
            {props.children}
        </div>
    </div>
}

export function FloatingAdd(props: any) {
    return <Fab
        color="primary" aria-label="הוסף"
        variant="circular"
        style={{
            position: "fixed",
            bottom: 100,
            left: 30,
            width: 80,
            height: 80,
            zIndex: 1000,
            borderRadius: '50%',
            backgroundColor: '#1AA7D4'
        }}
    >
        <Add style={{ fontSize: 80 }} onClick={props.onClick} />
    </Fab>
}



export const Style = {
    hidden: {
        position: "fixed",
        left: -1000,
        width: 10
    } as React.CSSProperties
};