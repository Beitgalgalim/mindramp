
import { useEffect, useState, useRef } from 'react';

import { setDateFunc } from "./types";
import DateFnsUtils from "@date-io/dayjs";
import { HBox, Text, Spacer } from './elem';
import ReactDatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";

const dayjs = require('dayjs');


const MonthMap: { [id: string]: string; } = {
    Jan: "ינו",
    Feb: "פבר",
    Mar: "מרץ",
    Apr: "אפר",
    May: "מאי",
    Jun: "יוני",
    Jul: "יולי",
    Aug: "אוג",
    Sep: "ספט",
    Oct: "אוק",
    Nov: "נוב",
    Dec: "דצמ",
};

const day2DayName: { [id: number]: string; } = {
    0: "ראשון",
    1: "שני",
    2: "שלישי",
    3: "רביעי",
    4: "חמישי",
    5: "שישי",
    6: "שבת",
};

function getNiceDate(d: Date | null | undefined): string {
    if (!d)
        return "";

    const djs = dayjs(d);
    let res = day2DayName[djs.day()] + ", " + MonthMap[djs.format("MMM")] + "-" + djs.format("DD");
    if (djs.year() !== dayjs().year()) {
        res += ", " + djs.year();
    }
    return res;

}

export default function MyDatePicker({ start, end, setStart, setEnd }:
    { start: Date | null | undefined, end: Date | null | undefined, setStart: setDateFunc, setEnd: setDateFunc }) {
    let datePicker = useRef<ReactDatePicker | null>(null);

    const elem = <Text
        textDecoration={"underline"}
        on={() => datePicker?.current?.setOpen(true)}>
        {getNiceDate(start)}
    </Text>;
    return (
        <HBox>
            <ReactDatePicker
                ref={datePicker}
                selected={start}
                onChange={(d: any) => setStart(dayjs(d).toDate())}
                shouldCloseOnSelect={true}
                customInput={elem}
            />
        </HBox>
    );
}