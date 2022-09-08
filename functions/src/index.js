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

function getAccessToken() {
    return admin.credential.applicationDefault().getAccessToken();
}

function sendNotification(accessToken, title, body, link, deviceToken) {
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

    const headers = {
        "Authorization": "Bearer " + accessToken.access_token,
        "Content-Type": "application/json",
    };
    const url = "https://fcm.googleapis.com/v1/projects/mindramp-58e89/messages:send";
    postData.message.token = deviceToken;

    return axios.post(url, postData, {
        headers,
    }).then(() => ({ success: true }));
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
        return db.collection(isDev ? "users_dev" : "users").doc(context.auth.token.email).collection("personal").doc("Default").get().then(doc => {
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
                }).then((res) => ({ success: true }));
            }
        });
    });
});

exports.notifications = functions.region("europe-west1").pubsub
    // minute (0 - 59) | hour (0 - 23) | day of the month (1 - 31) | month (1 - 12) | day of the week (0 - 6) - Sunday to Saturday
    .schedule("every 1 minutes")
    .timeZone(JERUSALEM)
    .onRun(async (context) => {
        function handleReminders(isDev) {
            const now = dayjs().utc().tz(JERUSALEM);
            const twoDaysAhead = now.add(2, "days");

            const eventsCollection = isDev ? "personal_event_dev" : "personal_event";
            const usersCollection = isDev ? "users_dev" : "users";

            return db.collection(eventsCollection).get().then(res => {

                // filter to events between today and 2 days ahead
                const events = res.docs.map(doc => ({ ref: doc.ref, ...doc.data() })).filter(ev =>
                    ev.reminderMinutes !== undefined &&
                    ev.date >= now.format("YYYY-MM-DD") &&
                    ev.date <= twoDaysAhead.format("YYYY-MM-DD") &&
                    ev.notified !== true);

                const allEvents = eventsUtil.explodeEvents(events, 0, 1);
                functions.logger.log("Notifications", "relevant events count:", allEvents.length);

                const notifyEvents = [];
                const userIDs = [];
                const reccurentEventsInstances = [];
                allEvents.forEach(ev => {
                    const reminderStart = dayjs(ev.start).subtract(ev.reminderMinutes, "minutes");

                    if (reminderStart.isBefore(now)) {
                        notifyEvents.push(ev);
                        ev.participants?.forEach(p => {
                            if (!userIDs.find(u => u === p.email)) {
                                userIDs.push(p.email);
                            }
                        });

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
                })
                functions.logger.log("Notifications, time:", now.format("YYYY-MM-DDTHH:mm"), "notify events", notifyEvents.map(e => ({ title: e.title, date: e.date, start: e.start, id: e.ref.id })));

                // fetch users' notification keys
                if (notifyEvents.length > 0) {
                    const waitForUsers = [];
                    const waitForInstancesInfo = [];
                    userIDs.forEach(email => waitForUsers.push(
                        db.collection(usersCollection).doc(email).collection("personal").doc("Default").get()
                    ));

                    reccurentEventsInstances.forEach(ei => waitForInstancesInfo.push(
                        ei.get()
                    ));

                    return Promise.allSettled(waitForUsers).then(allUsers => {
                        return Promise.all(waitForInstancesInfo).then(allRecurrentEventInstancesInfo => {
                            return getAccessToken().then(accessToken => {
                                const waitForNotifications = [];
                                const usersInfo = allUsers.filter(au => au.status === "fulfilled").map(au2 => ({ email: au2.value.ref._path.segments[1], ...au2.value.data() }));
                                const instancesInfo = allRecurrentEventInstancesInfo.filter(doc => doc.exists)
                                    .map(doc2 => ({ eventID: doc2.ref._path.segments[1], date: doc2.id, ...doc2.data() }));



                                notifyEvents.forEach(ev => {
                                    // makes sure the recurrent instance is not already notified
                                    if (ev.recurrent && ev.instanceStatus !== true) {
                                        const instanceInfo = instancesInfo.find(ii => ii.eventID === ev.ref.id && ii.date === ev.date);
                                        if (instanceInfo && instanceInfo.notified === true) {
                                            return;
                                        }
                                    }

                                    ev.participants?.forEach(p => {
                                        // find the userInfo and verify it has a notification token
                                        const userInfo = usersInfo.find(ui => ui.email === p.email);
                                        if (userInfo && userInfo.notificationOn === true && userInfo.notificationTokens) {
                                            const reminderStr = getReminderString(ev);
                                            userInfo.notificationTokens.forEach(nt => waitForNotifications.push(
                                                sendNotification(accessToken, ev.title, reminderStr, "https://mindramp-58e89.web.app/", nt.token)
                                            ));

                                            // Update event being notify:
                                            if (ev.recurrent && ev.instanceStatus !== true) {
                                                const instanceDocRef = ev.ref.collection("instancesInfo").doc(ev.date);
                                                waitForNotifications.push(
                                                    instanceDocRef.set({
                                                        notified: true,
                                                    })
                                                );
                                            } else {
                                                waitForNotifications.push(
                                                    ev.ref.update({ notified: true })
                                                );
                                            }
                                        }
                                    });
                                });
                                return Promise.all(waitForNotifications);
                            });

                        });
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
    const startTime = dayjs(ev.start);
    return getBeforeTimeText(startTime.diff(now, "minutes"));
}

function isBetween(num, from, to) {
    return num >= from && num <= to;
}

function getBeforeTimeText(minutes) {
    if (minutes < 0)
        return "התחיל לפני " + minutes + " דקות"

    if (minutes === 0)
        return "מתחיל עכשיו";

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
        return "מחר"
    }

    return "עוד מעל שעתיים";
}


exports.participantAdded = functions.region("europe-west1").firestore
    .document("personal_event/{eventID}")
    .onWrite((change, context) => {
        return handleParticipantAdded(false, change, context);
    });

exports.participantAddedDev = functions.region("europe-west1").firestore
    .document("personal_event_dev/{eventID}")
    .onWrite((change, context) => {
        return handleParticipantAdded(true, change, context);
    });


function handleParticipantAdded(isDev, change, context) {
    const added = [];
    let removed = [];
    const previousParticipants = [];
    let title = "";
    let date = "";

    if (change.before.exists) {
        change.before.data().participants.forEach(p =>
            previousParticipants.push(p.email));
        title = change.before.data().title;
        // todo format the date nice
        date = change.before.data().start;
    }

    if (change.after.exists) {
        title = change.after.data().title;
        // todo format the date nice
        date = change.after.data().start;


        change.after.data().participants.forEach(pAfter => {
            const prevIndex = previousParticipants.find(pp => pp.email === pAfter.email);
            if (!change.before.exists || prevIndex < 0) {
                added.push(pAfter.email);
            }
        });

        // remove those who are no longer in the after
        previousParticipants.forEach(pp => {
            if (!change.after.data().participants.find(pAfter => pAfter.email === pp.email)) {
                removed.push(pp.email);
            }
        })
    } else {
        removed = previousParticipants;
    }

    // if the event is in the past - return
    // TODO


    /*
      Send notification to added/removed participants
    */
    const usersCollectionName = isDev ? "users_dev" : "users";
    const usersColl = db.collection(usersCollectionName);

    const waitFoUsers = added.concat(removed).map(email =>
        usersColl.doc(email).collection("personal").doc("Default").get());

    return Promise.allSettled(waitFoUsers).then(allUsers => {
        return getAccessToken().then(accessToken => {
            const usersInfo = allUsers.filter(au => au.status === "fulfilled").map(au2 => ({ email: au2.value.ref._path.segments[1], ...au2.value.data() }));

            const waitForNotifications = [];

            added.forEach(addUser => {
                const userInfo = usersInfo.find(ui => ui.email === addUser);
                if (userInfo && userInfo.notificationOn === true && userInfo.notificationTokens) {
                    userInfo.notificationTokens.forEach(nt => waitForNotifications.push(
                        sendNotification(accessToken, "הוזמנת לפגישה", `
    בתאריך: ${date} נושא: ${title}
    `, "https://mindramp-58e89.web.app/", nt.token)
                    ));
                }
            });

            removed.forEach(removedUser => {
                const userInfo = usersInfo.find(ui => ui.email === removedUser);
                if (userInfo && userInfo.notificationOn === true && userInfo.notificationTokens) {
                    userInfo.notificationTokens.forEach(nt => waitForNotifications.push(
                        sendNotification(accessToken, "פגישתך בוטלה", `
    בתאריך: ${date} נושא: ${title}
    `, "https://mindramp-58e89.web.app/", nt.token)
                    ));
                }
            });

            return Promise.all(waitForNotifications);
        });
    });
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

    return isAdmin(isDev, context).catch((err)=>{
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
    )

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

