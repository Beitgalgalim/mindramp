const functions = require("firebase-functions");

const admin = require("firebase-admin");
const {
    FieldValue,
} = require("@google-cloud/firestore");

const axios = require("axios");
const eventsUtil = require("./events");
const archiver = require("archiver");
const fs = require("fs");


const dayjs = require("dayjs");

const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);
const JERUSALEM = "Asia/Jerusalem";

const express = require("express");
const webhookMiddleware = require("x-hub-signature").middleware;
const bodyParser = require("body-parser");

const app = express();

const NOTIFICATIONS_COLLECTION = "notifications";
const USERS_COLLECTION = "users";


admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    // databaseAuthVariableOverride: {
    //     token: {
    //         email: functions.config().admin.email,
    //     },
    // },
    projectId: "mindramp-58e89",
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
    if (!context.auth) {
        return;
    }
    const { notificationOn, notificationToken, isDev } = data;
    const docRef = db.collection(isDev ? "users_dev" : "users").doc(context.auth.token.email).collection("personal").doc("Default");
    return docRef.get().then(doc => {
        const update = {};
        if (notificationOn !== undefined) {
            update.notificationOn = notificationOn;
            if (update.notificationOn === false) {
                // remove existing tokens
                update.notificationTokens = [];
            }
        }

        if (notificationToken != undefined) {
            if (doc.exists) {
                if (doc.data().notificationTokens === undefined || !doc.data().notificationTokens.find(nt => nt.token === notificationToken.token)) {
                    update.notificationTokens = FieldValue.arrayUnion(notificationToken);
                }
            } else {
                update.notificationTokens = [notificationToken];
            }
        }

        functions.logger.info("Update Notifications", "update", update);
        if (doc.exists) {
            return doc.ref.update(update);
        } else {
            return docRef.set(update);
        }
    });
});

// function getAccessToken() {
//     return admin.credential.applicationDefault().getAccessToken();
// }

// function sendNotification(accessToken, title, body, link, deviceToken) {
//     const postData = {
//         message: {
//             "notification": {
//                 "title": title,
//                 "body": body,
//             },
//             "webpush": link ? {
//                 "fcm_options": {
//                     "link": link,
//                 },
//             } : undefined,
//         },
//     };

//     const headers = {
//         "Authorization": "Bearer " + accessToken.access_token,
//         "Content-Type": "application/json",
//     };
//     const url = "https://fcm.googleapis.com/v1/projects/mindramp-58e89/messages:send";
//     postData.message.token = deviceToken;

//     return axios.post(url, postData, {
//         headers,
//     }).then(() => ({ success: true }));
// }

exports.sendNotificationTest = functions.region("europe-west1").https.onCall((data, context) => {
    const { isDev } = data;

    if (context?.auth?.token?.email?.length > 0) {
        return addNotification(undefined, "test_notification", [], [], [context.auth.token.email], isDev);
    }

    // const postData = {
    //     message: {
    //         "notification": {
    //             "title": title,
    //             "body": body,
    //         },
    //         "webpush": link ? {
    //             "fcm_options": {
    //                 "link": link,
    //             },
    //         } : undefined,
    //     },
    // };

    // return getAccessToken().then((accessToken) => {
    //     return db.collection(isDev ? "users_dev" : "users").doc(context.auth.token.email).collection("personal").doc("Default").get().then(doc => {
    //         if (doc.exists && doc.data().notificationTokens && doc.data().notificationTokens.length > 0) {
    //             const headers = {
    //                 "Authorization": "Bearer " + accessToken.access_token,
    //                 "Content-Type": "application/json",
    //             };
    //             const url = "https://fcm.googleapis.com/v1/projects/mindramp-58e89/messages:send";
    //             const notifToken = doc.data().notificationTokens[0];
    //             postData.message.token = notifToken.token;

    //             return axios.post(url, postData, {
    //                 headers,
    //             }).then((res) => ({ success: true }));
    //         }
    //     });
    // });
});

exports.notifications = functions.region("europe-west1").pubsub
    // minute (0 - 59) | hour (0 - 23) | day of the month (1 - 31) | month (1 - 12) | day of the week (0 - 6) - Sunday to Saturday
    .schedule("every 1 minutes")
    .timeZone(JERUSALEM)
    .onRun(async (context) => {
        function handleReminders(isDev) {
            const now = dayjs().utc().tz(JERUSALEM);
            const twoDaysAhead = now.add(2, "days");

            const eventsCollection = isDev ? "event_dev" : "event";

            return db.collection(eventsCollection).get().then(res => {
                // filter to events between today and 2 days ahead
                const events = res.docs.map(doc => ({ ref: doc.ref, ...doc.data() })).filter(ev =>
                    ev.reminderMinutes !== undefined &&
                    ev.date >= now.format("YYYY-MM-DD") &&
                    ev.date <= twoDaysAhead.format("YYYY-MM-DD") &&
                    ev.notified !== true);

                const allEvents = eventsUtil.explodeEvents(events, 0, 1);

                const notifyEvents = [];
                const reccurentEventsInstances = [];
                allEvents.forEach(ev => {
                    const reminderStart = dayjs.tz(ev.start, JERUSALEM).subtract(ev.reminderMinutes, "minutes");

                    if (reminderStart.isBefore(now)) {
                        notifyEvents.push(ev);
                        if (ev.recurrent && ev.instanceStatus !== true) {
                            // If no materialized instance for the event instance, the "notified" flag will be
                            // persisted in a sub collection under the event
                            // event/<event-id>/instancesInfo/<date>
                            //  {notified:true}
                            reccurentEventsInstances.push(ev.ref.collection("instancesInfo").doc(ev.date));
                        }
                    } else {
                        functions.logger.log("Notifications, time:", now.format("YYYY-MM-DDTHH:mm"), "skipped event:", ({ title: ev.title, date: ev.date, start: ev.start, id: ev.ref.id, reminderAt: reminderStart.format("YYYY-MM-DDTHH:mm") }));
                    }
                });
                functions.logger.log("Notifications, time:", now.format("YYYY-MM-DDTHH:mm"), "notify events" + (isDev ? " dev" : ""), notifyEvents.map(e => ({ title: e.title, date: e.date, start: e.start, id: e.ref.id })));

                if (notifyEvents.length > 0) {
                    const waitForInstancesInfo = [];

                    reccurentEventsInstances.forEach(ei => waitForInstancesInfo.push(
                        ei.get()
                    ));

                    return Promise.all(waitForInstancesInfo).then(allRecurrentEventInstancesInfo => {
                        const instancesInfo = allRecurrentEventInstancesInfo.filter(doc => doc.exists)
                            .map(doc2 => ({ eventID: doc2.ref._path.segments[1], date: doc2.id, ...doc2.data() }));
                        const waitForNotifications = [];
                        notifyEvents.forEach(ev => {
                            // makes sure the recurrent instance is not already notified
                            if (ev.recurrent && ev.instanceStatus !== true) {
                                const instanceInfo = instancesInfo.find(ii => ii.eventID === ev.ref.id && ii.date === ev.date);
                                if (instanceInfo && instanceInfo.notified === true) {
                                    return;
                                }
                            }

                            const notifyList = getParticipantsAsArray(ev.participants).map(p => p.email);
                            if (ev.guide && !notifyList.find(nl => nl === ev.guide.email)) {
                                notifyList.push(ev.guide.email);
                            }

                            const batch = db.batch();

                            addNotification(batch, "event_reminder", [ev.title, getReminderString(ev)], [], notifyList, isDev);

                            // Update event being notified:
                            if (ev.recurrent && ev.instanceStatus !== true) {
                                const instanceDocRef = ev.ref.collection("instancesInfo").doc(ev.date);
                                batch.set(instanceDocRef, { notified: true });
                            } else {
                                batch.update(ev.ref, { notified: true });
                            }
                            waitForNotifications.push(batch.commit());
                        });
                        return Promise.all(waitForNotifications);
                    });
                }
            });
        }

        return Promise.all([
            handleReminders(true),
            handleReminders(false),
        ]);
    });


function getReminderString(ev, now) {
    const startTime = dayjs.tz(ev.start, JERUSALEM);
    return getBeforeTimeText(startTime.diff(now, "minutes"));
}

function isBetween(num, from, to) {
    return num >= from && num <= to;
}

function getBeforeTimeText(minutes) {
    if (minutes < 0) {
        return " לפני " + minutes + " דקות";
    }

    if (minutes === 0) {
        return " עכשיו";
    }

    if (isBetween(minutes, 0, 10)) {
        return "עוד " + minutes + " דקות";
    }

    if (isBetween(minutes, 10, 15)) {
        return "עוד רבע שעה";
    }

    if (isBetween(minutes, 15, 23)) {
        return "עוד 20 דקות";
    }
    if (isBetween(minutes, 23, 37)) {
        return "עוד חצי שעה";
    }
    if (isBetween(minutes, 37, 51)) {
        return "עוד שלושת רבעי שעה";
    }
    if (isBetween(minutes, 51, 75)) {
        return "עוד שעה";
    }
    if (isBetween(minutes, 75, 100)) {
        return "עוד שעה וחצי";
    }
    if (isBetween(minutes, 100, 130)) {
        return "עוד שעתיים";
    }
    if (minutes > 1400) {
        return "מחר";
    }

    return "עוד מעל שעתיים";
}

exports.participantAdded = functions.region("europe-west1").firestore
    .document("event/{eventID}")
    .onWrite((change, context) => {
        return handleParticipantAdded(false, change, context);
    });

exports.participantAddedDev = functions.region("europe-west1").firestore
    .document("event_dev/{eventID}")
    .onWrite((change, context) => {
        return handleParticipantAdded(true, change, context);
    });

function getParticipantsAsArray(participants) {
    const ret = [];
    if (participants) {
        // eslint-disable-next-line no-unused-vars
        for (const [key, value] of Object.entries(participants)) {
            ret.push(value);
        }
    }
    return ret;
}


function handleParticipantAdded(isDev, change, context) {
    const added = [];
    let removed = [];
    let previousParticipants = [];
    let title = "";
    let date = "";
    let guideBefore = undefined;
    let guideAfter = undefined;

    if (change.before.exists) {
        previousParticipants = getParticipantsAsArray(change.before.data().participants);

        title = change.before.data().title;
        date = change.before.data().start;
        guideBefore = change.before.data().guide?.email;
    }

    if (change.after.exists) {
        if (eventsUtil.inThePast(change.after.data().end)) {
            // if the event ends in the past
            return;
        }

        title = change.after.data().title;
        date = change.after.data().start;

        const newParticipants = getParticipantsAsArray(change.after.data().participants);

        newParticipants.forEach(pAfter => {
            const prevIndex = previousParticipants.find(pp => pp.email === pAfter.email);
            if (!change.before.exists || prevIndex < 0) {
                added.push(pAfter.email);
            }
        });

        // remove those who are no longer in the after
        previousParticipants.forEach(pp => {
            if (!newParticipants.find(pAfter => pAfter.email === pp.email)) {
                removed.push(pp.email);
            }
        });

        guideAfter = change.after.data().guide?.email;
    } else {
        removed = previousParticipants;
    }

    const niceDate = eventsUtil.getNiceDate(date);

    /*
      Send notification to added/removed participants
    */

    const batch = db.batch();
    if (added.length > 0) {
        addNotification(batch, "person_added2", [title, niceDate.day, niceDate.date, niceDate.hour], [], added, isDev);
    }
    if (removed.length > 0) {
        addNotification(batch, "person_removed2", [title, niceDate.day, niceDate.date, niceDate.hour], [], removed, isDev);
    }

    // if (meetigChange) {
    // notify about the change to participants not in removed and not in added
    // }

    if (guideBefore !== guideAfter) {
        if (guideBefore) {
            addNotification(batch, "guide_removed", [title, niceDate.day, niceDate.date, niceDate.hour], [], [guideBefore], isDev);
        }

        if (guideAfter) {
            addNotification(batch, "guide_added", [title, niceDate.day, niceDate.date, niceDate.hour], [], [guideAfter], isDev);
        }
    } else if (guideAfter) {
        // todo meeting update - notify guideAfter
    }

    return batch.commit();
}

const isAdmin = (isDev, context) => {
    return new Promise((resolve, reject) => {
        if (!context.auth) {
            reject(new Error("NotAuthenticated"));
            return;
        }

        db.collection(isDev ? "users_dev" : "users").doc(context.auth.token.email).collection("system").doc("Default").get().then(doc => {
            if (doc.exists && doc.data().admin === true) {
                resolve();
            } else {
                reject(new Error("NotAnAdmin"));
            }
        });
    });
};

exports.isAdmin = functions.region("europe-west1").https.onCall((data, context) => {
    const isDev = data.isDev;

    return isAdmin(isDev, context).catch((err) => {
        throw new functions.https.HttpsError("permission-denied", "AdminRequired", err.message);
    });
});


/**
 * Expects:
 * data= {
 *      info: { <whatever to go into users collection>}
 *      email: <email>,
 *      password: {password}
 *      displayName: <a display name for Firebase>
 *      isAdmin: bool
 * }
 */
exports.registerUser = functions.region("europe-west1").https.onCall((data, context) => {
    functions.logger.info("register new user", data);
    const isDev = data.isDev;

    return isAdmin(isDev, context).then(
        () => {
            return admin.auth()
                .createUser({
                    uid: data.email,
                    email: data.email,
                    emailVerified: false,
                    password: data.password,
                    displayName: data.displayName,
                    disabled: false,
                })
                .then(
                    () => {
                        return db.collection(isDev ? "users_dev" : "users").doc(data.email).set({
                            ...data.info
                        }).then(
                            () => {
                                if (data.isAdmin) {
                                    return db.collection(isDev ? "users_dev" : "users").doc(data.email).collection("system").doc("Default").set(
                                        { admin: true }
                                    );
                                }
                            }
                        );
                    },
                    (err) => {
                        throw new functions.https.HttpsError("failed-precondition", err.message, err.details);
                    });
        }
    );
});


const backupCollections = [
    { name: "event" },
    { name: "media" },
    { name: "rooms" },
    {
        name: "users",
        subCollections: [
            { name: "system" },
            { name: "personal" },
        ],
    },
];

exports.BackupDB = functions.region("europe-west1").pubsub
    // minute (0 - 59) | hour (0 - 23) | day of the month (1 - 31) | month (1 - 12) | day of the week (0 - 6) - Sunday to Saturday
    .schedule("00 01 * * *") // Every day at 01:00
    .timeZone("Asia/Jerusalem")
    .onRun((context) => {
        const zipName = "backup|" + dayjs().format("YYYY-MM-DD HH:mm") + ".zip";
        const output = fs.createWriteStream("/tmp/" + zipName);
        const archive = archiver("zip", {
            gzip: true,
            zlib: { level: 9 }, // Sets the compression level.
        });

        archive.on("error", (err) => {
            functions.logger.error("BackupDB failed", err);
            throw (err);
        });

        // pipe archive data to the output file
        archive.pipe(output);

        const waitFor = [];

        for (let i = 0; i < backupCollections.length; i++) {
            waitFor.push(db.collection(backupCollections[i].name).get().then(async (collData) => {
                const name = backupCollections[i].name + "|" + dayjs().format("YYYY-MM-DD HH:mm") + ".json";
                const fileName = "/tmp/backup|" + name;

                fs.appendFileSync(fileName, "[\n");
                for (let docIndex = 0; docIndex < collData.size; docIndex++) {
                    const doc = collData.docs[docIndex];
                    const backupDoc = doc.data();
                    backupDoc._docID = doc.ref.id;

                    if (backupCollections[i].subCollections) {
                        for (let j = 0; j < backupCollections[i].subCollections.length; j++) {
                            const subColl = backupCollections[i].subCollections[j];
                            const subColDocs = await db.collection(backupCollections[i].name).doc(doc.ref.id).collection(subColl.name).get();
                            backupDoc[subColl.name] = [];
                            subColDocs.forEach(subColDoc => {
                                const backupSubColDoc = subColDoc.data();
                                backupSubColDoc._docID = subColDoc.ref.id;
                                backupDoc[subColl.name].push(backupSubColDoc);
                            });
                        }
                    }

                    fs.appendFileSync(fileName, JSON.stringify(backupDoc, undefined, " "));
                    fs.appendFileSync(fileName, ",\n");
                }
                fs.appendFileSync(fileName, "]");
                console.log("add to archive", name);
                archive.file(fileName, { name });
            }));
        }
        return Promise.all(waitFor).then(() => {
            console.log("finalize archive");
            archive.finalize().then(
                () => admin.storage().bucket().upload("/tmp/" + zipName, {
                    destination: `backups/${zipName}`,
                }).then(
                    () => console.log("Backup complete successfuly!"),
                    (err) => console.log("Backup failed", err)),
            );
        });
    });

/**
*  *******************
*  WhatApp integration
*  *******************
- The integration is based on WhatsApp Business API.
- Facebook offer a free tier of 1000 conversations a month. A conversation is counted as follows:
  either user initiated or business initiated message, followed by any number of messages in the next 24hours window.
  This means, if we have about 50 active users in Beit Galgalim and
  all of them interact with the system on every working day (~20 days a month), then we reach the limit, and start pay
  around .02 cent per conversation.
- We register one phone number to be the "system"'s number, and all interactions are 1:1 between the system and a parson.
- To send a whatsApp message, simply insert a record into "notifications" collection. It has to have a template if this is
  business initiated message, so a template must be prepared and approved in facebook
- free text (not template based), are to respond to users messages. One the business responds, it is allowed to send anything.

- Message we plan to send/recieve:
  - you are invited to a meeting (done)
    - approval of meeting invite (todo)
  - you are removed from a meeting (done)
  - your meeting is modified (todo)
  - password reset (done)
  - meeting reminder (todo)
  - backup failed - send to system operators (todo)


**/


const addNotification = (batch, message_template, parametersValues, quickReplyParameters, toEmailArray, isDev) => {
    const notifDoc = db.collection(NOTIFICATIONS_COLLECTION).doc();
    const parameters = parametersValues.map(text => ({ type: "text", text }));
    const docData = {
        message_template,
        parameters,
        quickReplyParameters,
        createdAt: FieldValue.serverTimestamp(),
        to: toEmailArray,
        isDev,
    };
    if (batch) {
        batch.set(notifDoc, docData);
        return;
    }

    return notifDoc.set(docData);
};

const addNotificationFree = (message_body, toEmailArray, isDev) => {
    const notifDoc = db.collection(NOTIFICATIONS_COLLECTION).doc();
    const docData = {
        message_body,
        createdAt: FieldValue.serverTimestamp(),
        to: toEmailArray,
        isDev,
    };

    return notifDoc.set(docData);
};


app.get("/whatsapp/webhooks", (req, res) => {
    functions.logger.info("WhatApp Webhooks GET: " + JSON.stringify(req.query), req.query);
    if (req.query["hub.verify_token"] == functions.config().whatsapp.verifytoken && req.query["hub.mode"] == "subscribe") {
        res.send(req.query["hub.challenge"]);
    }

    res.send("fail");
});

app.use(bodyParser.json({
    verify: webhookMiddleware.extractRawBody,
}));

app.use(webhookMiddleware({
    algorithm: "sha256",
    secret: functions.config().whatsapp.appsecret,
    require: false,
    header: "x-hub-signature-256",
}));

app.post("/whatsapp/webhooks", (req, res) => {
    functions.logger.info("WhatApp Webhooks POST: ", req.body);
    const sentSignature = req.headers["x-hub-signature-256"];
    if (!sentSignature) {
        functions.logger.info("WhatApp webhook is missing 'x-hub-signature' header", req.headers);
        res.send("not ok");
        return;
    }
    // if it exists, the x-hub-sgnature middleware has checked it to be valid.

    if (req.body.object === "whatsapp_business_account") {
        const entry = req.body ? req.body.entry[0] : undefined;
        if (entry) {
            const waitFor = entry.changes.map(change => {
                if (change?.value?.messages) {
                    change.value.messages.forEach(message => {
                        if (message?.text?.body?.length > 0 ||
                            message.button && message.button.text === "todo") {
                            const text = message.text ? message.text.body : message.button.payload;


                            // find the user, based on his/her phone
                            const phoneNumber = message.from.replace("972", "0");
                            return db.collection("users").where("phone", "==", phoneNumber).get().then(res => {
                                if (res.docs && res.docs.length > 0) {
                                    const email = res.docs[0].id;
                                    if (text.startsWith("סיסמא") || text.startsWith("סיסמה")) {
                                        const newPwd = text.substr(5).trim();
                                        // change password flow:
                                        const auth = admin.auth();
                                        return auth.getUserByEmail(email).then((userRecord) => {
                                            auth.updateUser(userRecord.uid, {
                                                email: email,
                                                password: newPwd,
                                            }).then(
                                                () => {
                                                    functions.logger.info("Successful password reset", email);
                                                    return addNotificationFree("סיסמא הוחלפה בהצלחה. \nמשתמש: " + email + "\nסיסמא חדשה: " + newPwd + "\n", [email], false);
                                                },
                                                err => {
                                                    functions.logger.info("Password reset failed", email, err);
                                                    return addNotificationFree("החלפת סיסמא נכשלה.\nשגיאה: " + err.toString() + "\n", [email], false);
                                                });
                                        });
                                    }
                                }
                            });
                        } else {
                            functions.logger.info("unknown message: ", message.from, message.text.body);

                            return sendFreeMessage("בקשה/הודעה לא מוכרת - בקשת נדחית.", [message.from]);
                        }
                    });
                } else {
                    functions.logger.info("unknown incoming post whatsapp webhook: ", change);
                }
            });

            return Promise.all(waitFor).then(() => res.status(200).send("EVENT_RECEIVED"));
        }
    }

    res.status(200).send("EVENT_RECEIVED");
});


const sendFreeMessage = (msg_body, numbers) => {
    const postData = {
        messaging_product: "whatsapp",
        to: "",
        type: "text",
        text: {
            preview_url: false,
            body: msg_body,
        },
    };
    return sendWhatAppMessage(postData, numbers);
};

const sendTemplateMessage = (msg_template, parameters, quickReplyParameters, numbers) => {
    const components = [];
    if (parameters && parameters.length > 0) {
        components.push({
            type: "body",
            parameters,
        });
    }

    if (quickReplyParameters && quickReplyParameters.length > 0) {
        components.push(quickReplyParameters.map((param, i) => ({
            type: "button",
            sub_type: "quick_reply",
            index: "" + i,
            parameters: [
                {
                    "type": "payload",
                    "payload": param,
                },
            ],
        })));
    }

    const postData = {
        messaging_product: "whatsapp",
        to: "",
        type: "template",
        template: {
            name: msg_template,
            language: { code: "he" },
            components,
        },
    };
    return sendWhatAppMessage(postData, numbers);
};

const sendWhatAppMessage = (postData, numbers) => {
    const url = `https://graph.facebook.com/v14.0/${functions.config().whatsapp.phoneid}/messages`;

    const headers = {
        "Authorization": "Bearer " + functions.config().whatsapp.accesstoken,
        "Content-Type": "application/json",
    };

    const waitFor = [];
    numbers.forEach((number) => {
        postData.to = number.startsWith("0") ?
            "972" + number.substr(1) :
            number.startsWith("+") ? number.substr(1) : number;

        // functions.logger.info("send whatsapp", { url, postData, headers });

        waitFor.push(
            axios.post(url, postData, {
                headers,
            }),
        );
    });
    return Promise.all(waitFor);
};

exports.httpApp = functions.region("us-central1").https.onRequest(app);

exports.notificationAdded = functions.region("europe-west1").firestore
    .document("notifications/{notifID}")
    .onCreate((snapshot, context) => {
        const isDev = snapshot.data().isDev;

        const usersRef = db.collection(isDev ? "users_dev" : USERS_COLLECTION);
        return usersRef.get().then(users => {
            const to = snapshot.data().to;
            const phoneNumbers = [];

            if (to.length > 0 && to[0] === "all" || to[0] === "all-exclude") {
                users.docs.forEach(user => {
                    if (to[0] === "all" || !to.find(t => t === user.ref.id)) {
                        // Send Message
                        if (user && user.data().phone && user.data().phone.length > 0) {
                            phoneNumbers.push(user.data().phone);
                        }
                    }
                });
            } else {
                to.forEach(sentToUser => {
                    const user = users.docs.find(u => u.ref.id === sentToUser);

                    if (user && user.data().phone && user.data().phone.length > 0) {
                        phoneNumbers.push(user.data().phone);
                    }
                });
            }

            if (phoneNumbers.length > 0) {
                if (snapshot.data().message_template) {
                    return sendTemplateMessage(snapshot.data().message_template, snapshot.data().parameters,
                        snapshot.data().quickReplyParameters, phoneNumbers);
                } else {
                    return sendFreeMessage(snapshot.data().message_body, phoneNumbers);
                }
            }
        });
    });
