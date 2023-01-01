
 import { useRef, useState, Fragment } from 'react';

// import { DatePickerProps } from "./types";
// import { HBox, Spacer, ClickableText, ComboBox } from './elem';
// import ReactDatePicker from "react-datepicker";

// import "react-datepicker/dist/react-datepicker.css";
// import { DateFormats, day2DayName, getTimes, MonthMap, parseTime, replaceDatePreserveTime2, validTime } from './utils/date';

// //const dayjs = require('dayjs');
// import dayjs from './localDayJs'




// const times = getTimes();

// // function getNiceDate(d: string): string {
// //     if (!d)
// //         return "";

// //     const djs = dayjs(d);
// //     let res = day2DayName[djs.day()] + ", " + MonthMap[djs.format("MMM")] + "-" + djs.format("DD");
// //     if (djs.year() !== dayjs().year()) {
// //         res += ", " + djs.year();
// //     }
// //     return res;
// // }

// function getTime(d: string): string {
//     if (!d)
//         return "";

//     const djs = dayjs(d);
//     return djs.format(DateFormats.TIME_AM_PM);
// }

// function calcDiff(d: string, newTime: string) {
//     if (!d) {
//         return 0;
//     }
//     const time = parseTime(newTime);
//     const fromDate = dayjs(d);
//     const toDate = dayjs(d).hour(time.hours).minute(time.minutes)
//     return toDate.diff(fromDate, 'minutes', true);
// }


// export default function MyDatePicker({ start, end, setStart, setEnd, style, allDay, readOnly }: DatePickerProps) {
//     const [invalidStart, setInvalidStart] = useState(false);
//     const [invalidEnd, setInvalidEnd] = useState(false);
//     const [invalidDate, setInvalidDate] = useState(false);
//     const [open, setOpen] = useState<boolean>(false);

//     let dateStartPicker = useRef<ReactDatePicker | null>(null);
//     let dateEndPicker = useRef<ReactDatePicker | null>(null);

//     const setStartTime = (newTime: string) => {
//         if (!validTime(newTime)) {
//             setInvalidStart(true);
//             return
//         }
//         setInvalidStart(false);

//         const diffMin = calcDiff(start, newTime);
//         if (diffMin !== 0) {
//             setStart(dayjs(start).add(diffMin, "minutes").format(DateFormats.DATE_TIME));
//             setEnd(dayjs(end).add(diffMin, "minutes").format(DateFormats.DATE_TIME));
//         }
//     }

//     const setEndTime = (newTime: string) => {
//         if (!validTime(newTime)) {
//             setInvalidEnd(true);
//             return
//         }
//         setInvalidEnd(false);

//         const diffMin = calcDiff(end, newTime);
//         if (diffMin !== 0) {
//             setEnd(dayjs(end).add(diffMin, "minutes").format(DateFormats.DATE_TIME));
//         }
//     }

//     // const setDate = (newDate: string) => {
//     //     const valid = dayjs(newDate).isValid();
//     //     setInvalidDate(valid);
//     //     if (valid) {
//     //         setStart(replaceDatePreserveTime2(start, newDate));
//     //         setEnd(replaceDatePreserveTime2(end, newDate));
//     //     }
//     // }

//     const setEndDate = (newEndDate: string) => {
//         //setStart(replaceDatePreserveTime2(start, newEndDate));
//         if (dayjs(start).isAfter(newEndDate)) {
//             newEndDate = start;
//         }
//         // since all day events don't show the next day, add one day

//         setEnd(dayjs(newEndDate).add(1, "days").format(DateFormats.DATE_TIME));
//     }

//     return (
//         <HBox style={{ width: "100%", ...style }}>
//             <div style={{ width: "40%" }}>
//                 <ReactDatePicker
//                     ref={dateStartPicker}
//                     disabled={!!readOnly}
//                     selected={dayjs(start).toDate()}
//                     onChange={(d: Date) => {
//                         console.log("picker change")
//                         //setDate(dayjs(d).format(DateFormats.DATE))
//                     }}
//                     shouldCloseOnSelect={true}
//                     onCalendarOpen={() => setOpen(true)}
//                     onCalendarClose={() => setOpen(false)}
//                     customInput={
//                         <ClickableText
//                             showExpand={true}
//                             onClick={() => dateStartPicker?.current?.setOpen(true)}
//                             readOnly={readOnly}
//                             setOpen={(o: boolean) => dateStartPicker?.current?.setOpen(o)}
//                             onBlur={(val: string) => {
//                                 console.log("text change date", val)
//                                 //setDate(val)
//                             }}
//                             open={open}
//                             invalid={invalidDate}
//                         />

//                     }
//                     dateFormat={"dd/MM/yy"}
//                 />
//             </div>
//             <Spacer width={"5%"} />

//             {!allDay && <Fragment>
//                 <ComboBox
//                     hideExpandButton={true}
//                     listStyle={{ textAlign: "left", width: "35%" }}
//                     listWidth={100}
//                     value={getTime(start)} items={times}
//                     onSelect={(newValue: string) => setStartTime(newValue)}
//                     onChange={(newValue: string) => {
//                         setStartTime(newValue)
//                     }}
//                     invalid={invalidStart}
//                     readOnly={readOnly}
//                 />
//                 <Spacer width={"2%"} />
//                 -
//                 <Spacer width={"2%"} />

//                 <ComboBox
//                     hideExpandButton={true}
//                     listStyle={{ textAlign: "left", width: "35%" }}
//                     listWidth={100}
//                     value={getTime(end)} items={getTimes(dayjs(start))}
//                     onSelect={(newValue: string) => setEndTime(newValue)}
//                     onChange={(newValue: string) => setEndTime(newValue)}
//                     invalid={invalidEnd}
//                     readOnly={readOnly}
//                 />

//             </Fragment>}
//             {allDay && <div style={{ width: "40%" }}>
                

//                 <ReactDatePicker
//                     ref={dateEndPicker}

//                     selected={dayjs(end).subtract(1, "days").isAfter(start) ?
//                         dayjs(end).subtract(1, "days").toDate() :
//                         dayjs(start).toDate()
//                     }
//                     onChange={(d: Date) => setEndDate(dayjs(d).format(DateFormats.DATE))}
//                     shouldCloseOnSelect={true}
//                     customInput={
//                         <ClickableText
//                             showExpand={true}
//                             onClick={() => dateEndPicker?.current?.setOpen(true)}
//                             readOnly={readOnly}
//                             invalid={invalidDate}
//                             onValueChange={(val: string) => {
//                                 //setDate(val)
//                             }}
//                         />
//                     }
//                     dateFormat={"dd/MM/yy"}
//                 />
//             </div>}
//         </HBox>
//     );
// }