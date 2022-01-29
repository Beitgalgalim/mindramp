
import React from 'react';
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

export const ResponsiveTab = withStyles({
    root: {
        minWidth: 65,
        width: 65
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
    const { children, onClick } = props;
    return <div
        ref={ref}
        onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'lightgray' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        onClick={onClick}>
        {children}
    </div>;
});

export function ComboBox(props: any) {
    const { items, value } = props;
    const [open, setOpen] = React.useState(false);

    const elRef = React.useRef<HTMLDivElement | null>(null);
    const currentIndex = items.findIndex((item: any) => item === value);

    const renderItem = ({ index, style }: { index: number, style: any }) => (
        <ListItem style={{ ...style, padding: 0 }} key={index} selected={currentIndex === index} >
            <ListItemButton style={{ padding: 0 }}
            onClick={()=>props.onSelect(items[index])}>
                <ListItemText
                    disableTypography
                    primary={<Typography style={{ fontSize: 12 }}>{items[index]}</Typography>}
                />
            </ListItemButton>
        </ListItem>
    );

    

    return <ClickAwayListener onClickAway={() => setOpen(false)} >
        <div>
            <ClickableText
                ref={elRef}
                onClick={() => {
                    setOpen(true)
                }}>
                {value}
            </ClickableText>
            <Popper
                open={open}
                anchorEl={elRef.current}
                transition disablePortal style={{ zIndex: 1001, backgroundColor: 'white' }}>

                <FixedSizeList
                    itemCount={items.length}
                    height={150}
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


export const HBoxC = (props: any) => (<HBox style={{ alignItems: "center", justifyContent: "center", width: "100%", ...props.style }} >{props.children}</HBox>);
export const HBoxSB = (props: any) => (<HBox style={{ alignItems: "center", justifyContent: "space-between", width: "100%", ...props.style }} >{props.children}</HBox>);


export function HBox(props: any) {
    return <Box style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', ...props.style }}>
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