# Mind Ramp
a project to make digital calendar and events accessible for people with disabilities

Planned to be developed for the Beit Galgalim - an Israeli NPO (https://www.beitgalgalim.org.il)



# Development

- When running locally, using `npm start`, the app will use firestore collections with `_dev` (e.g. `event_dev`)
- If you wish to run against the production collections, you need to create a file `.env` in the root directory of the project (right next to package.json) and add this line:
```
REACT_APP_PRODDATA=true
```

- Running without .env or with value other than true is against the _dev collections.
- Note: uploaded wav/jpeg files still go to same location in the storage
