# grypesc/getRickRolled but better.

# Things I made better:

## Menu style 
- from boring style to neon style.

## Gameplay screen
- Gameplay didn't cover the full page, I fixed it.

## Removed Rickroll & Redirecting problem
- When player died, it got redirected to creepy page and showed alert "You got owned" then when he/she pressed ok or cancel it got redirected to rickroll. If player wanted to continue playing, he/she had to manually re enter the website, and re enter his/her name and play. Which definitely was very annoying, I fixed it so when you die it shows 5 second cooldown with clean UI that matches menu style before respawning you.

## Whimsical Golden Aura
- Players who has 10 or more kills will have better texture, if you find that texture `/game/static/client/sprites/player+.png` not good enough or should be changed you can always change it.

## Admin/Test Features
- If you open your browser console and type 
> runCmd(`"yourcustompassword"`,`"tp/killset/addbots"`,rank number of player you want to teleport to/number of kills you want to set/number of bots you want to add).

## Bug Fixes
- Removed many many bugs
> All things I talked about **grypesc/getRickRolled** was as of **Feburary 8th, 2026**.


# How to play with your friends & Enjoy.
You have to be connected to same Wifi. (You can be one who is sharing hotspot too)
open your terminal in this folder and type:
```
cd game
npm install
node server.js
```
After doing that enter **{YourIPAdress}:54070/** to play the game
### How to know what is your IP adress?
Open cmd or powershell and enter `ipconfig` and see what is next to IPv4Adress: