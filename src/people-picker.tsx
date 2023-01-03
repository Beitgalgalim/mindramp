import { Check, Close, PersonOutlined } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { Avatar, ComboBox, ComboBoxItem, HBox, HBoxSB, Spacer } from "./elem";
import { UserInfo, UserType } from "./types";

//const items = [{ key: "1", value: "אריאל" }, { key: "2", value: "מעין", icon: "https://firebasestorage.googleapis.com/v0/b/mindramp-58e89.appspot.com/o/media%2Fguides_pics%2F%D7%92%D7%99%D7%9C%20%D7%A1%D7%A1%D7%95%D7%91%D7%A8.jfif?alt=media&token=ee0ccfda-9f5b-46e3-8b18-739de90eeb8a" }];

function translate2ComboBoxItems(users: UserInfo[], type: undefined | UserType): ComboBoxItem[] {
    const filtered = type ? users.filter(u => u.type === type) : users;

    return filtered.map((u: UserInfo) => ({
        key: u._ref?.id || "",
        value: u.displayName,
        icon: u.avatar?.url || ""
    }));
}

export function PeoplePicker({listStyle, textStyle, onSelect, users, type, placeholder }: any) {
    const [items, setItems] = useState<any>(translate2ComboBoxItems(users, type));

    useEffect(() => {
        setItems(translate2ComboBoxItems(users, type));
    }, [users, type])

    return <ComboBox
        items={items}
        listStyle={listStyle}
        textStyle={textStyle}
        itemHeight={35}
        listWidth={150}
        placeholder={placeholder}
        hideExpandButton={false}
        onSelect={(key: string) => {
            onSelect(key);
        }}
        filterItem={(item: any, txtValue: string | undefined) => item && item?.value?.includes(txtValue)}
        renderItem={(item: any, hover: boolean, selected: boolean) => (<Person
            flat={true}
            name={item.value}
            icon={item.icon}
            selected={selected}
            hover={hover}
        />)}
    />
}


export function Person({ name, icon, hover, selected, onRemove, flat, width, available, tooltip, hideIcon }: any) {
    const backgroundColor = hover ? "#F5F5F5" : selected ? "#E1E1E1" : "#D9D9D9"
    return <div
        title={tooltip}
        style={{
            direction: "rtl",
            width,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            backgroundColor,
            height: 25,
            borderRadius: flat ? 0 : 15,
            margin: 2,
        }}>
        <HBoxSB>
            <HBox style={{position:"relative", alignItems:"center"}}>
                <Spacer />
                {!hideIcon && <Avatar size={25} imageSrc={icon} />}
                {available !== undefined && <div style={{position:"absolute", bottom:-4, right:-4, borderRadius:7, width:15, height:15,
                backgroundColor:available?"green":"red" }}>
                
                    </div>}
                <Spacer />
                {name}
            </HBox>
            <Spacer />
            {onRemove && <div style={{
                display: "flex",
                justifyContent: "center",
                alignItems:"center",
                width: 25, height: 25, borderRadius: 12,
                backgroundColor,
                zIndex:100,
            }}
                onClick={() => onRemove()}><Close style={{fontSize:15}} /></div>}
        </HBoxSB>
    </div>
}