
const dayjs = require('dayjs');

var weekOfYear = require('dayjs/plugin/weekOfYear')
dayjs.extend(weekOfYear)

const serviceAccount = require("/Users/I022021/Library/CloudStorage/OneDrive-SAPSE/Documents/BeitGalgalim/mindramp-58e89-firebase-adminsdk-hcppn-4d72e7e4ac.json");

var admin = require("firebase-admin");
var Excel = require("exceljs");


admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});



const db = admin.firestore();

const {
    FieldPath,
    FieldValue,
} = require("@google-cloud/firestore");


/* Functions for DevOps, maintenance */
function CountMessagesPerMonth() {
    db.collection("notifications").get().then(notifs => {
        const months = {

        }
        notifs.docs.map(n => n.data()).sort((a, b) => a.createdAt < b.createdAt ? -1 : 1).forEach(n => {
            const date = dayjs(n.createdAt);
            months[date.month()] = (months[date.month()] ? months[date.month()] + 1 : 1);
        })

        console.log(months);
    })
}
// CountMessagesPerMonth();

const days = {
    "יום א'": 0,
    "יום ב'": 1,
    "יום ג'": 2,
    "יום ד'": 3,
    "יום ה'": 4,
    "יום ו'": 5,
    "יום ש'": 6,
}


//export const importMeetingsFromExcel = functions.https.onRequest(async (req, res) => {
async function importMeetingsFromExcel() {
    try {
        const workbook = new Excel.Workbook();
        const xl = await workbook.xlsx.readFile("/Users/i022021/טבלת פעילות משתתפים 25-26.xlsx");
        const sheet = xl.worksheets[1];

        let editedEvents = [];
        for (let colIndex = 3; colIndex < 100; colIndex++) {
            let meetingName = sheet.getCell(1, colIndex).value
            if (!meetingName || meetingName == "" || meetingName == "סה\"כ") break;
            meetingName = meetingName.trim();

            let meetingDay = sheet.getCell(2, colIndex).value;


            const meetingDayNumber = days[meetingDay];

            function excelTimeToString(num) {
                const d = new Date(num);
                return (d.getUTCHours()) + ":" + d.getMinutes()
            }
            const meetingTime = excelTimeToString(sheet.getCell(3, colIndex).value);

            let currEvent = editedEvents.find(e => e.title == meetingName && e.day == meetingDayNumber);
            if (!currEvent) {
                currEvent = {
                    title: meetingName,
                    day: meetingDayNumber,
                    time: meetingTime,
                    participants: []
                };
                editedEvents.push(currEvent);
            }

            const participants = [];
            for (let row = 4; row < 100; row++) {
                const participant = sheet.getCell(row, 2).value;

                if (!participant) break;
                if (sheet.getCell(row, colIndex).value == 1) {
                    participants.push(participant);
                }
            }

            currEvent.participants = participants;

            //console.log("Meeting Name:", meetingName, meetingDayNumber, meetingTime, "Participants:", participants);
        }

        const events = await db.collection("event").get();


        const users = await db.collection("users").get();
        editedEvents.forEach(async (e) => {

            const matchUser = (rec, name) => {
                name = name.trim();
                const parts = name.trim().split(" ");
                if (!parts.length) return false;
                if (parts.length == 1) return rec.fname == name;
                return rec.fname == parts[0] && rec.lname.startsWith(parts[1]);
            }

            // find the user:
            const getParticipantKey = (email) => (email?.replace(/\./g, "")?.replace("@", ""));

            const participants = {};
            e.participants.forEach(p => {
                const user = users.docs.find(doc => matchUser(doc.data(), p));
                if (!user) {
                    console.log("Cannot find user:", p)
                } else {
                    const icon = user.data().avatar?.url;
                    participants[getParticipantKey(user.id)] = {

                        displayName: user.data().fname + " " + user.data().lname,
                        email: user.id,
                        ...(icon ? { icon } : {})
                    }

                }
            })

            // update meeting
            const foundEv = events.docs.filter(doc => //doc.data().recurrent &&
                doc.data().title.trim() == e.title && dayjs(doc.data().date).day() == e.day && (doc.id != "2Um9PdLHml3fkbvi7rdY"));
            if (foundEv.length == 1) {
                const cEv = foundEv[0]
                // update participants
                // await cEv.ref.update({
                //     participants
                // });
                console.log("Meeting Name:", cEv.data().title, dayjs(cEv.data().date).day(),  cEv.data().start, e.day, e.time)
                //console.log("set part", participants.map(p => p.displayName))
            } else {
                 if (foundEv.length > 1) {
                     console.log("ambiguis ", e.title);
                 }
                if (!e.title.startsWith("בוטל")) {
                    console.log("cannot find event ", e.title);
                }
            }

        });
    } catch (error) {
        console.error("Error importing meetings:", error);
    }
}
// importMeetingsFromExcel();


async function cleanOldMeetings() {
    const events = await db.collection("event").get();
    const batch = db.batch();
    events.forEach(doc => {
        const endDate = dayjs(doc.data().end);
        if (endDate.add(3, "months").isBefore(dayjs())) {
            // old events, check not recurrent
            if (!doc.data().recurrent || doc.data().instanceStatus == true) {
                batch.delete(doc.ref);
                console.log("Delete ", doc.data().title, doc.data().end, doc.data().recurrent)
            }
        }
    });
    //await batch.commit()
}

//cleanOldMeetings()