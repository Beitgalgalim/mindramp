
const dayjs = require('dayjs');

var weekOfYear = require('dayjs/plugin/weekOfYear')
dayjs.extend(weekOfYear)

const serviceAccount = require("/Users/I022021/Library/CloudStorage/OneDrive-SAPSE/Documents/BeitGalgalim/mindramp-58e89-firebase-adminsdk-hcppn-4d72e7e4ac.json");

var admin = require("firebase-admin");


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
        notifs.docs.map(n=>n.data()).sort((a,b)=>a.createdAt < b.createdAt ? -1 : 1).forEach(n=>{
            const date = dayjs(n.createdAt);
            months[date.month()] = (months[date.month()]? months[date.month()] + 1 : 1);
        })

        console.log(months);
    })
}
// CountMessagesPerMonth();

