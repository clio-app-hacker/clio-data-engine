# Clio Data Engine (WIP)
A simple OAuth server for populating CLIO developer account with massive amounts of data

Sample data is generated with Mockaroo. Schemas are in ./schemas folder and can be imported back into Mockaroo.

## Prerequisites/Tools

nodeJS and npm

you can use either nvm or nodenv (prefered by clio) to set you nodeJS and npm versions

```
MacOS exmaple:

brew install nodenv
nodenv -install 10.9.0
nodenv global 10.9.0
brew install yarn
npm install -g nodemon
```


## Setup
Edit ./src/server/config.json and fill in the Client ID and Client Secrect (Or use the one already configured)

You can get those from https://app.clio.com/nc/#/settings?path=settings%2Fdeveloper_applications

## Run
1. npm install 
2. npm start

## Test

http://localhost:3001/oauth will do the OAuth authentication

If successful your Browser should have been redirected to http://localhost:3001/done and show "Setup done" in the Browser window.

Users have to be created manually
 - https://www.mailinator.com has a public inbox which allows you to add users from CLIO Manage using <name>@mailinator.com as the email to use for inviting someone.

  You will need to folloing users if you use the datasets in this repo

   - <yourself>
   - Frank Hallet
   - Dave Stiller
   - Eugene Mars
   - Hickup Haddock
   - Astrid Hofferson
   - Snotlout Jorgenson
   - Spitelout Jorgenson
   - Stoick Haddock

Use Postman to retrieve the users and replace ./data/Users.json, this is needed as the Ids are different
for everyone.

After that you can use `http://localhost:3001/populate` to populate the authorized account.



 

