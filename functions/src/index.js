import * as functions from "firebase-functions";


const admin = require("firebase-admin");
const dayjs = require("dayjs");

admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // databaseAuthVariableOverride: {
    //     token: {
    //         email: functions.config().admin.email,
    //     },
    // },
    storageBucket: "mindramp-58e89.appspot.com",
});

const db = admin.firestore();

exports.houseKeeping = functions.region("europe-west1").pubsub
    // minute (0 - 59) | hour (0 - 23) | day of the month (1 - 31) | month (1 - 12) | day of the week (0 - 6) - Sunday to Saturday
    .schedule("00 10 * * *")
    .timeZone("Asia/Jerusalem")
    .onRun((context) => {
        // Clean up old events:
        const twoMonthsAgo = dayjs().sub(-60, "days").format("YYYY-MM-DD");
        db.collection("event")
            //.where("date", "<", threeMonthsAgo)
            .get().then((events) => {
                const batch = db.batch();

                const oldEvents = events.docs.filter(
                    (doc) => doc.data.date() < twoMonthsAgo &&
                        doc.data().recurrent === undefined);
                oldEvents.forEach((doc) => {
                    batch.delete(doc.ref);
                    const archiveRef = db.collection("event-archive").doc(doc.ref.id);
                    batch.set().set(archiveRef, doc.data());
                });

                return batch.commit();
            });
    });

