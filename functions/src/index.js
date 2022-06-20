const functions = require("firebase-functions");

const admin = require("firebase-admin");
const {
    FieldValue,
} = require("@google-cloud/firestore");

const axios = require("axios");
const eventsUtil = require("./events");
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
    const { notificationOn, notificationToken, isDev } = data;
    return db.collection(isDev ? "users_dev" : "users").doc(context.auth.token.email).collection("personal").doc("Default").get().then(doc => {
        if (doc.exists) {
            const update = {};
            if (notificationOn !== undefined) {
                update.notificationOn = notificationOn;
                if (update.notificationOn === false) {
                    // remove existing tokens
                    update.notificationTokens = FieldValue.delete();
                }
            }

            if (notificationToken != undefined) {
                if (doc.data().notificationTokens === undefined || !doc.data().notificationTokens.find(nt => nt.token === notificationToken.token)) {
                    update.notificationTokens = FieldValue.arrayUnion(notificationToken);
                }
            }
            functions.logger.error("Update Notifications", "update", update);

            return doc.ref.update(update);
        } else {
            functions.logger.error("Update Notifications", "user-not-found", context.auth.token.email);
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