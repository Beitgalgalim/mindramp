
import { useRef, useState, Fragment } from 'react';

import { DatePickerProps, NewDatePickerProps } from "./types";
import { HBox, Spacer, ClickableText, ComboBox } from './elem';
import ReactDatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import "./css/date-picker.css"
import { DateFormats, DateJSParseFormats, day2DayName, getTimes, MonthMap, parseTime, replaceDatePreserveTime2, validTime } from './utils/date';

import dayjs from './localDayJs'
import { Dayjs } from 'dayjs';

const times = getTimes();



function getTime(d: string): string {
    if (!d)
        return "";

    const djs = dayjs(d);
    return djs.format(DateFormats.TIME_AM_PM);
}

function calcDiff(d: string, newTime: string) {
    if (!d) {
        return 0;
    }
    const time = parseTime(newTime);
    const fromDate = dayjs(d);
    const toDate = dayjs(d).hour(time.hours).minute(time.minutes)
    return toDate.diff(fromDate, 'minutes', true);
}


export default function NewDatePicker({
    start, end,
    setStart, setEnd,
    fontSize,
    pickTimes, isDateRange, readOnly }: NewDatePickerProps) {
    const [invalidStart, setInvalidStart] = useState(false);
    const [invalidEnd, setInvalidEnd] = useState(false);
    const [invalidStartDate, setInvalidStartDate] = useState<string | undefined>(undefined);
    const [invalidEndDate, setInvalidEndDate] = useState<string | undefined>(undefined);
    const [startOpen, setStartOpen] = useState<boolean>(false);
    const [endOpen, setEndOpen] = useState<boolean>(false);
    const [startLocal, setStartLocal] = useState<string>(dayjs(start).format(DateFormats.DATE_LOCALE));
    const [endLocal, setEndLocal] = useState<string>(dayjs(end).format(DateFormats.DATE_LOCALE));
    const [startTimeLocal, setStartTimeLocal] = useState<string>(getTime(start));
    const [endTimeLocal, setEndTimeLocal] = useState<string>(getTime(end));
    

    let dateStartPicker = useRef<ReactDatePicker | null>(null);
    let dateEndPicker = useRef<ReactDatePicker | null>(null);

    const setStartTime = (newTime: string) => {
        setStartTimeLocal(newTime);
        if (!validTime(newTime)) {
            setInvalidStart(true);
            return
        }
        setInvalidStart(false);

        const diffMin = calcDiff(start, newTime);
        if (diffMin !== 0) {
            setStart(dayjs(start).add(diffMin, "minutes").format(DateFormats.DATE_TIME));
            setEnd(dayjs(end).add(diffMin, "minutes").format(DateFormats.DATE_TIME));
        }
    }

    const setEndTime = (newTime: string) => {
        setEndTimeLocal(newTime);

        if (!validTime(newTime)) {
            setInvalidEnd(true);
            return
        }
        setInvalidEnd(false);

        const diffMin = calcDiff(end, newTime);
        if (diffMin !== 0) {
            setEnd(dayjs(end).add(diffMin, "minutes").format(DateFormats.DATE_TIME));
        }
    }

    const setDate = (newDate: Dayjs, fromPicker: boolean) => {
        setInvalidStartDate(newDate.isValid() ? undefined : newDate.format(DateFormats.DATE_LOCALE));
        if (newDate.isValid()) {
            if (fromPicker) {
                setStartLocal(newDate.format(DateFormats.DATE_LOCALE));
            } else {
                setStartLocal(newDate.format(DateFormats.DATE_TIME));
            }

            console.log("valid date", newDate)

            const newStart = replaceDatePreserveTime2(start, newDate)
            if (newStart) {
                setStart(newStart);
            } else {
                setInvalidStartDate(newDate.format(DateFormats.DATE_LOCALE));
            }
            const newEnd = replaceDatePreserveTime2(end, newDate);
            if (newEnd) {
                setEnd(newEnd);
            } else {
                setInvalidEndDate(newEnd);
            }
        } else {
            setStartLocal(newDate.format(DateFormats.DATE_TIME));
        }
    }

    const setEndDate = (newEndDate: Dayjs, fromPicker:boolean) => {
        
        if (fromPicker) {
            setEndLocal(newEndDate.format(DateFormats.DATE_LOCALE));
        } else {
            setEndLocal(newEndDate.format(DateFormats.DATE_TIME));
        }
        const valid = dayjs(newEndDate).isValid();
        setInvalidEndDate(valid ? undefined : newEndDate.format(DateFormats.DATE_LOCALE));
        if (valid) {
            if (dayjs(start).isAfter(newEndDate)) {
                newEndDate = dayjs(start);
            }
            // since all day events don't show the next day, add one day
            setEnd(newEndDate.add(1, "days").format(DateFormats.DATE_TIME));
        }
    }

    return (
        <div className="datepicker-container" >
            <div style={{ width: "100%" }}>
                <ReactDatePicker
                    className="datepicker-dateinput"
                    ref={dateStartPicker}
                    disabled={!!readOnly}
                    selected={dayjs(start).toDate()}
                    onChange={(d: Date) => {
                        console.log("picker change")
                        setDate(dayjs(d), true)
                    }}
                    shouldCloseOnSelect={true}
                    onCalendarOpen={() => setStartOpen(true)}
                    onCalendarClose={() => setStartOpen(false)}
                    customInput={
                        <ClickableText
                            style={{ textAlign: "center", fontSize }}
                            showExpand={!readOnly}
                            onClick={() => dateStartPicker?.current?.setOpen(true)}
                            readOnly={readOnly}
                            setOpen={(o: boolean) => dateStartPicker?.current?.setOpen(o)}
                            onValueChange={(val: string) => {
                                setDate(dayjs(val), false)
                            }}
                            open={startOpen}
                            invalid={invalidStartDate != undefined}
                            textValue={invalidStartDate != undefined ? invalidStartDate : startLocal}
                        />
                    }
                    dateFormat={"dd/MM/yy"}
                />
            </div>
            {pickTimes && <div className="datepicker-time-range">
                <ComboBox
                    hideExpandButton={readOnly}
                    listStyle={{ textAlign: "left", fontSize }}
                    textStyle={{ textAlign: "center" , fontSize}}
                    listWidth={100}
                    value={getTime(start)}
                    items={times}
                    onSelect={(newValue: string) => {
                        console.log("time selected", newValue)
                        setStartTime(newValue)
                    }}
                    onChange={(newValue: string) => {
                        console.log("time change", newValue)
                        setStartTime(newValue)
                    }}
                    invalid={invalidStart}
                    readOnly={readOnly}
                    allowFreeText={true}
                />
                <div className="datepicker-time-range-sep">-</div>
                <ComboBox
                    hideExpandButton={readOnly}
                    listStyle={{ textAlign: "left", fontSize }}
                    textStyle={{ textAlign: "center", fontSize }}
                    listWidth={100}
                    value={getTime(end)}
                    items={getTimes(dayjs(start))}
                    onSelect={(newValue: string) => setEndTime(newValue)}
                    onChange={(newValue: string) => setEndTime(newValue)}
                    invalid={invalidEnd}
                    readOnly={readOnly}
                    allowFreeText={true}
                />
            </div>}

            {isDateRange &&
                <ReactDatePicker
                    className="datepicker-dateinput"
                    ref={dateEndPicker}
                    disabled={!!readOnly}
                    selected={end ? dayjs(end).subtract(1,"day").toDate() :
                        dayjs(start).subtract(1,"day").toDate()
                    }
                    onChange={(d: Date) => 
                        setEndDate(dayjs(d), true)}
                    shouldCloseOnSelect={true}
                    onCalendarOpen={() => setEndOpen(true)}
                    onCalendarClose={() => setEndOpen(false)}

                    customInput={
                        <ClickableText
                            style={{ textAlign: "center", fontSize }}
                            showExpand={!readOnly}
                            onClick={() => dateEndPicker?.current?.setOpen(true)}
                            readOnly={readOnly}
                            setOpen={(o: boolean) => dateEndPicker?.current?.setOpen(o)}
                            onValueChange={(val: string) => {
                                setEndDate(dayjs(val), false)
                            }}
                            open={endOpen}
                            invalid={invalidEndDate != undefined}
                            textValue={invalidEndDate != undefined ? invalidEndDate : endLocal}
                        />
                    }
                    dateFormat={"dd/MM/yy"}
                />
            }
        </div>
    );
}