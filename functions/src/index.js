const functions = require("firebase-functions");

const admin = require("firebase-admin");
const {
    FieldValue,
} = require("@google-cloud/firestore");

const axios = require("axios");

// const dayjs = require("dayjs");

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

// exports.houseKeeping = functions.region("europe-west1").pubsub
//     // minute (0 - 59) | hour (0 - 23) | day of the month (1 - 31) | month (1 - 12) | day of the week (0 - 6) - Sunday to Saturday
//     .schedule("00 10 * * *")
//     .timeZone("Asia/Jerusalem")
//     .onRun((context) => {
//         // Clean up old events:
//         const twoMonthsAgo = dayjs().sub(-60, "days").format("YYYY-MM-DD");
//         db.collection("event")
//             //.where("date", "<", threeMonthsAgo)
//             .get().then((events) => {
//                 const batch = db.batch();

//                 const oldEvents = events.docs.filter(
//                     (doc) => doc.data.date() < twoMonthsAgo &&
//                         doc.data().recurrent === undefined);
//                 oldEvents.forEach((doc) => {
//                     batch.delete(doc.ref);
//                     const archiveRef = db.collection("event-archive").doc(doc.ref.id);
//                     batch.set().set(archiveRef, doc.data());
//                 });

//                 return batch.commit();
//             });
//     });

exports.updateNotification = functions.region("europe-west1").https.onCall((data, context) => {
    const notificationOn = data.notificationOn;
    const notificationToken = data.notificationToken;
    return db.collection("users_dev").doc(context.auth.token.email).collection("personal").doc("Default").get().then(doc => {
        if (doc.exists) {
            const update = {};
            if (notificationOn !== undefined) {
                update.notificationOn = notificationOn;
            }

            if (notificationToken != undefined) {
                if (doc.data().notificationTokens === undefined || !doc.data().notificationTokens.find(nt => nt.token === notificationToken.token)) {
                    update.notificationTokens = FieldValue.arrayUnion(notificationToken);
                }
            }
            return doc.ref.update(update);
        }
    });
});

function getAccessToken() {
    return admin.credential.applicationDefault().getAccessToken();
}


exports.sendNotificationTest = functions.region("europe-west1").https.onCall((data, context) => {
    const { title, body, link, isDev } = data;

    const postData = {
        message: {
            "notification": {
                "title": title,
                "body": body,
            },
            "webpush": link ? {
                "fcm_options": {
                    "link": link,
                },
            } : undefined,
        },
    };

    return getAccessToken().then((accessToken) => {
        return db.collection(isDev?"users_dev":"users").doc(context.auth.token.email).collection("personal").doc("Default").get().then(doc => {
            if (doc.exists && doc.data().notificationTokens && doc.data().notificationTokens.length > 0) {
                const headers = {
                    "Authorization": "Bearer " + accessToken.access_token,
                    "Content-Type": "application/json",
                };
                const url = "https://fcm.googleapis.com/v1/projects/mindramp-58e89/messages:send";
                const notifToken = doc.data().notificationTokens[0];
                postData.message.token = notifToken.token;

                return axios.post(url, postData, {
                    headers,
                });
            }
        });
    });
});
